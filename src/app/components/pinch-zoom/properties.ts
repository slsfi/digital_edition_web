export const defaultProperties = {
    transitionDuration: 200,
    doubleTap: true,
    doubleTapScale: 2,
    limitZoom: 'original image size',
    autoZoomOut: false,
    disabled: false,
    overflow: 'hidden',
    zoomControlScale: 1,
    zoomControl: 'two-buttons',
    backgroundColor: 'rgba(0,0,0,0.85)',
    minPanScale: 1.0001,
    minScale: 0,
    disableZoomControl: 'auto',
    listeners: 'mouse and touch',
    wheel: true,
    wheelZoomFactor: 1,
    draggableImage: true
  };
  
  export const backwardCompatibilityProperties = {
    'transition-duration': 'transitionDuration',
    'double-tap': 'doubleTap',
    'double-tap-scale': 'doubleTapScale',
    'auto-zoom-out': 'autoZoomOut',
    'limit-zoom': 'limitZoom'
  };
  