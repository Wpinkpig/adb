<template>
  <div class="layout-tool-template modelToolBar" v-if="modelToolBarIsShow">
    <span>淹没分析</span>
    <div class="splitline"></div>
    <div class="app-container" v-if="switchActive">
      <el-button
        type="primary"
        @click="drawExtent"
        size="mini"
        :disabled="isDraw"
        >绘制范围</el-button
      >
      <el-button
        type="primary"
        @click="induationAnalysis"
        size="mini"
        :disabled="!isDraw"
        >淹没分析</el-button
      >
      <el-button
        type="primary"
        @click="clearAllEntities"
        size="mini"
        :disabled="!isDraw"
        >清除</el-button
      >
      <div class="water-bartool">
        最大高度：<el-input
          v-model="maxWaterHeight"
          size="mini"
          disabled
        ></el-input
        >&nbsp;&nbsp;米
      </div>
      <div class="water-bartool">
        最小高度：<el-input
          v-model="minWaterHeight"
          disabled
          size="mini"
        ></el-input
        >&nbsp;&nbsp;米
      </div>
      <div class="water-bartool warningHeight">
        预警高度：<el-input
          v-model="warningWaterHeight"
          :disabled="warningWaterHeightDisabled"
          size="mini"
        ></el-input
        >&nbsp;&nbsp;米
      </div>
      <div class="water-bartool">
        淹没速度：<el-input v-model="speed" size="mini"></el-input
        >&nbsp;&nbsp;m/s
      </div>
      <div class="water-bartool" v-show="waterHeightShow">
        实时高度：<span class="waterInfo">{{ waterHeight }}</span
        >&nbsp;&nbsp;m
      </div>
    </div>
  </div>
</template>

<script>
import * as turf from "@turf/turf";

let activeShapePoints = [];
let floatingPoint = undefined;
let activeShape = undefined;
let handler = undefined;
export default {
  data() {
    return {
      switchActive: true,
      modelToolBarIsShow: true,
      isDraw: false,
      maxWaterHeight: 2000,
      minWaterHeight: 0,
      warningWaterHeight: 0, // 预警高度
      waterHeight: 0,
      waterHeightShow: false,
      speed: "1",
      waterHeightTimeer: 0,
      waterPrimitive: undefined,
      tempEntities: [],
      warningWaterHeightDisabled: false,
    };
  },
  beforeDestroy() {
    // 关闭当前组件之前清除所有数据
    this.handCloserModel();
  },
  methods: {
    handCloserModel() {
      
      this.modelToolBarIsShow = false;
      this.clearAllEntities();
    },
    /**
     * @author: 
     * @Date: 2022-11-13 16:44:02
     * @note: 注意事项
     * @description: 绘制范围
     */
    drawExtent() {
      if (viewer.terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
        this.$modal.msgWarning("请先开启地形！");
        return;
      }
      // 开启深度检测
      window.viewer.scene.globe.depthTestAgainstTerrain = true;
      handler = new Cesium.ScreenSpaceEventHandler(window.viewer.canvas);

      handler.setInputAction((event) => {
        const earthPosition = viewer.scene.pickPosition(event.position);
        if (Cesium.defined(earthPosition)) {
          if (activeShapePoints.length === 0) {
            floatingPoint = this.createPoint(earthPosition);
            activeShapePoints.push(earthPosition);
            const dynamicPositions = new Cesium.CallbackProperty(function () {
              return new Cesium.PolygonHierarchy(activeShapePoints);
            }, false);
            activeShape = this.drawShape(dynamicPositions, Cesium.Color.RED);
          }
          activeShapePoints.push(earthPosition);
          this.tempEntities.push(this.createPoint(earthPosition));
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      handler.setInputAction((event) => {
        if (Cesium.defined(floatingPoint)) {
          const newPosition = viewer.scene.pickPosition(event.endPosition);
          if (Cesium.defined(newPosition)) {
            floatingPoint.position.setValue(newPosition);
            activeShapePoints.pop();
            activeShapePoints.push(newPosition);
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      handler.setInputAction((event) => {
        activeShapePoints.pop();
        if (activeShapePoints.length < 3) return;

        this.tempEntities.push(this.drawPolyline(activeShapePoints));
        let ploy = this.drawShape(
          activeShapePoints,
          Cesium.Color.fromBytes(64, 157, 253, 20)
        );
        this.tempEntities.push(ploy);
        this.getAreaHeight(activeShapePoints);

        window.viewer.entities.remove(floatingPoint);
        window.viewer.entities.remove(activeShape);
        floatingPoint = undefined;
        activeShape = undefined;
        handler.destroy(); // 关闭事件句柄
        handler = null;
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:48:43
     * @note: 注意事项
     * @description: 获取区域内最大最小高程
     * @param {*} positions
     */
    getAreaHeight(positions) {
      let startP = positions[0];
      let endP = positions[positions.length - 1];
      if (startP.x != endP.x && startP.y != endP.y && startP.z != endP.z)
        positions.push(positions[0]);

      const tempPoints = [];
      for (let i = 0; i < positions.length; i++) {
        var ellipsoid = window.viewer.scene.globe.ellipsoid;
        var cartographic = ellipsoid.cartesianToCartographic(positions[i]);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        tempPoints.push([lng, lat]);
      }
      var line = turf.lineString(tempPoints);
      var chunk = turf.lineChunk(line, 10, { units: "meters" });

      const tempArray = [];
      chunk.features.forEach((f) => {
        f.geometry.coordinates.forEach((c) => {
          tempArray.push(Cesium.Cartographic.fromDegrees(c[0], c[1]));
        });
      });

      var promise = Cesium.sampleTerrainMostDetailed(
        window.viewer.terrainProvider,
        tempArray
      ).then((updatedPositions) => {
        const max = Math.max.apply(
          Math,
          updatedPositions.map((item) => {
            return item.height;
          })
        );
        const min = Math.min.apply(
          Math,
          updatedPositions.map((item) => {
            return item.height;
          })
        );
        this.waterHeight = Math.ceil(min);
        this.minWaterHeight = Math.ceil(min);
        this.maxWaterHeight = Math.ceil(max);
        // 禁用绘制按钮
        this.isDraw = !this.isDraw;
        this.warningWaterHeightDisabled = false;
      });
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:46:47
     * @note: 注意事项
     * @description: 创建点
     * @param {*} worldPosition
     */
    createPoint(worldPosition) {
      const point = window.viewer.entities.add({
        position: worldPosition,
        point: {
          color: Cesium.Color.SKYBLUE,
          pixelSize: 5,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
      return point;
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:46:37
     * @note: 注意事项
     * @description: 绘制多边形
     * @param {*} positionData
     * @param {*} mat
     */
    drawShape(positionData, mat) {
      let shape = window.viewer.entities.add({
        polygon: {
          hierarchy: positionData,
          material: mat,
          outline: true,
          outlineColor: Cesium.Color.SKYBLUE,
          outlineWidth: 4,
        },
      });
      return shape;
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:46:11
     * @note: 注意事项
     * @description: 绘制线
     * @param {*} positions
     */
    drawPolyline(positions) {
      if (positions.length < 1) return;

      let startP = positions[0];
      let endP = positions[positions.length - 1];
      if (startP.x != endP.x && startP.y != endP.y && startP.z != endP.z)
        positions.push(positions[0]);

      return window.viewer.entities.add({
        name: "polyline",
        polyline: {
          positions: positions,
          width: 2.0,
          material: Cesium.Color.SKYBLUE,
          clampToGround: true,
        },
      });
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:45:05
     * @note: 注意事项
     * @description: 淹没分析
     */
    induationAnalysis() {
      if (
        Number(this.warningWaterHeight) < Number(this.minWaterHeight) ||
        Number(this.warningWaterHeight) > Number(this.maxWaterHeight)
      ) {
        this.$message({
          message: "预警高度必须在最大高度和最小高度之间",
          type: "warning",
        });
        return;
      }
      this.warningWaterHeightDisabled = true;
      let shape = window.viewer.entities.add({
        polygon: {
          hierarchy: activeShapePoints,
          material: Cesium.Color.fromBytes(64, 157, 253, 20),
          extrudedHeight: Number(this.warningWaterHeight),
          outline: true,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 4,
          // perPositionHeight: true
        },
      });
      this.tempEntities.push(shape);

      this.waterHeightShow = true;
      this.waterHeight = Number(this.minWaterHeight);
      const en = window.viewer.entities.add({
        polygon: {
          hierarchy: activeShapePoints,
          extrudedHeight: new Cesium.CallbackProperty(() => {
            return this.waterHeight;
          }, false),
          material: Cesium.Color.fromBytes(64, 157, 253, 150),
        },
      });
      this.tempEntities.push(en);

      this.waterHeightTimeer = setInterval(() => {
        this.waterHeight += Number(this.speed);

        let l =
          this.speed.split(".").length > 1
            ? this.speed.split(".")[1].length
            : 0;
        this.waterHeight = Number(this.waterHeight.toFixed(l));
        this.maxWaterHeight = Number(this.maxWaterHeight);
        this.minWaterHeight = Number(this.minWaterHeight);
        if (
          this.waterHeight > this.maxWaterHeight ||
          this.waterHeight < this.minWaterHeight
        ) {
          clearInterval(this.waterHeightTimeer);
          this.waterHeight =
            this.waterHeight > this.maxWaterHeight
              ? this.maxWaterHeight
              : this.minWaterHeight;
        }
      }, 1000);
    },

    /**
     * @author: 
     * @Date: 2022-11-13 16:44:42
     * @note: 注意事项
     * @description: 清除当前页面所有数据
     */
    clearAllEntities() {
      if (this.waterHeightTimeer) {
        clearInterval(this.waterHeightTimeer);
      }
      this.positions = [];
      const length = this.tempEntities.length;
      for (let f = 0; f < length; f++) {
        window.viewer.entities.remove(this.tempEntities[f]);
      }
      this.tempEntities = [];
      this.waterHeightShow = false;
      activeShapePoints = [];
      this.warningWaterHeight = 0;
      this.isDraw = !this.isDraw;
      floatingPoint = undefined;
      activeShape = undefined;
      if (handler) {
        handler.destroy(); // 关闭事件句柄
        handler = undefined;
      }
    },
  },
};
</script>

<style lang="scss" scoped>

.modelToolBar{
  position: absolute;
  z-index: 999;
  margin: 8px;
}

.water-bartool {
  margin-top: 10px;

  .waterInfo {
    font-size: 16px;
    font-weight: 600;
    color: red;
  }
}

.warningHeight {
  color: red;
  font-weight: 600;
}

/deep/ .el-input {
  width: 120px;

  .el-input__inner {
    // color: #FFFFFF;
    text-align: center;
    // background-color: rgba(38,38,38,0.5);
    // border: 1px solid rgba(110, 110, 110, 0.8);
  }
}
</style>