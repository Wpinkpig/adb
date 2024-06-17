<template>
  <div>
    <div id="map3DView">
    <ymfx></ymfx>
  </div>
  </div>
</template>

<script>
import ymfx from "./index.vue"

const Cesium = require('cesium/Cesium')
let viewer = undefined

export default {
  components:{
    ymfx
  },
  name: 'map3DView',
  data () {
    return {      
    }
  },
  mounted(){
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMmQ5ZmIyOC02MTliLTQ2MWEtOWNiYi1lNmY3ODRjNmMwMzkiLCJpZCI6MjE1ODg0LCJpYXQiOjE3MTU5MzM0ODJ9.t8_1xCDNcO3XUrtLFJm93ngBBbHSE1p0nmPflSu7xDs';
    viewer = new Cesium.Viewer("map3DView", {
      requestRenderMode: true, // 开启请求的渲染模式
      maximumRenderTimeChange: Infinity, // 处理模拟时间改变
      animation: false, // 是否创建动画小器件，左下角仪表
      baseLayerPicker: false, // 是否显示图层选择器
      fullscreenButton: false, // 是否显示全屏按钮
      geocoder: false, // 是否显示geocoder小器件，右上角查询按钮
      homeButton: false, // 是否显示Home按钮
      infoBox: false, // 是否显示信息框
      shouldAnimate: true,  // 允许动画
      sceneModePicker: false, // 是否显示3D/2D选择器
      selectionIndicator: false, // 是否显示选取指示器组件鼠标绿色框
      timeline: true, // 是否显示时间轴
      navigationHelpButton: false, // 是否显示右上角的帮助按钮
      vrButton: false, // 是否显示双屏
      scene3DOnly: true, // 如果设置为true，则所有几何图形以3D模式绘制以节约GPU资源
      fullscreenElement: document.body, // 全屏时渲染的HTML元素
      allowDataSourcesToSuspendAnimation: false,
      navigationInstructionsInitiallyVisible: false,
      terrainProvider: Cesium.createWorldTerrain(),
      orderIndependentTranslucency: false,
      contextOptions: {
        webgl: {
          alpha: true,
          depth: true,
          stencil: true,
          antialias: true, //!mobilecheck(),
          premultipliedAlpha: true,
          //通过canvas.toDataURL()实现截图需要将该项设置为true
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: true
        }
      },
      requestWaterMask: true // 水面特效
    })
    viewer.shadows = true //开启或关闭阴影

    // 关闭抗锯齿
    viewer.scene.fxaa = true
    viewer.scene.postProcessStages.fxaa.enabled = true;

    //开启帧率检测
    viewer.scene.debugShowFramesPerSecond = true;

    // 开启全球光照
    viewer.scene.globe.enableLighting = false

    //更改配置，性能优化
    viewer.scene.logarithmicDepthBuffer = true;
    // 取消双击事件-追踪该位置
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    window.viewer = viewer;
    window.Cesium = Cesium;
    
    viewer.camera.flyTo({ 
      destination: Cesium.Cartesian3.fromDegrees(103.04756,37.48098,21119200),
      orientation: {
        heading: 6.07, 
        pitch: -1.53,
      },
      duration: 5 
    })

  }
}
</script>

<style lang="scss" scoped>
#map3DView{
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;

  /* cesium 去版权 */
    /deep/ .cesium-widget-credits {
      display: none !important;
      visibility: hidden !important;
    }
    
    /deep/ .cesium-widget-credits {
      display: none !important;
      visibility: hidden !important;
    }

    /* 隐藏时间轴 */
    /deep/ .cesium-viewer-timelineContainer{
      display: none;
    }
    
    /* 帧率位置控制 */
    /deep/ .cesium-performanceDisplay-defaultContainer{
      top: auto;
      bottom: 36px;
    }

    /* 隐藏帧率名称 */
    /deep/ .cesium-performanceDisplay-throttled{
      display: none;
    }
  }
</style>
