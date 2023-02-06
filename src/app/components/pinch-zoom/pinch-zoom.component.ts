import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    Output,
    OnDestroy,
    SimpleChanges
  } from '@angular/core';
  
  import { Properties } from './interfaces';
  import {
    defaultProperties,
    backwardCompatibilityProperties
  } from './properties';
  import { IvyPinch } from './ivypinch';
  
  @Component({
    selector: 'pinch-zoom, [pinch-zoom]',
    exportAs: 'pinchZoom',
    templateUrl: './pinch-zoom.component.html',
    styleUrls: ['pinch-zoom.component.scss']
  })
  export class PinchZoomComponent implements OnDestroy {
    pinchZoom: any;
    _properties?: Properties;
    zoomControlPositionClass?: string;
  
    @Input('properties') set properties(value: Properties) {
      if (value) {
        this._properties = value;
      }
    }
    get properties() {
      return this._properties as any;
    }
  
    @Input('transition-duration') transitionDuration = 200;
    @Input('double-tap') doubleTap = true;
    @Input('double-tap-scale') doubleTapScale = 2;
    @Input('auto-zoom-out') autoZoomOut = false;
    @Input('limit-zoom') limitZoom?: number | 'original image size';
    @Input('disabled') disabled: boolean = false;
    @Input() disablePan?: boolean;
    @Input() overflow?: 'hidden' | 'visible';
    @Input() zoomControlScale: number = 1;
    @Input() zoomControl?: 'one-button' | 'two-buttons';
    @Input() disableZoomControl?: 'disable' | 'never' | 'auto';
    @Input() zoomControlPosition?: 'right' | 'right-bottom' | 'bottom';
    @Input() backgroundColor: string = 'rgba(0,0,0,0.85)';
    @Input() limitPan?: boolean;
    @Input() minPanScale: number = 0.1;
    @Input() minScale: number = 0.1;
    @Input() listeners: 'auto' | 'mouse and touch' = 'mouse and touch';
    @Input() wheel: boolean = true;
    @Input() fullImage?: {
      path: string;
      minScale?: number;
    };
    @Input() autoHeight: boolean = false;
    @Input() wheelZoomFactor: number = 1;
    @Input() draggableImage: boolean = true;
  
    @Output() events: EventEmitter<any> = new EventEmitter();
  
    @HostBinding('style.overflow')
    get hostOverflow() {
      return this.properties['overflow'];
    }
    @HostBinding('style.background-color')
    get hostBackgroundColor() {
      return this.properties['backgroundColor'];
    }
  
    get isTouchScreen() {
      var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
      var mq = function(query: any) {
        return window.matchMedia(query).matches;
      };
  
      if ('ontouchstart' in window) {
        return true;
      }
  
      // include the 'heartz' as a way to have a non matching MQ to help terminate the join
      // https://git.io/vznFH
      var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join(
        ''
      );
      return mq(query);
    }
  
    get isDragging() {
      return this.pinchZoom.isDragging();
    }
  
    get isDisabled() {
      return this.properties['disabled'];
    }
  
    get scale() {
      return this.pinchZoom.scale;
    }
  
    get x() {
      return this.pinchZoom.moveX;
    }
  
    get y() {
      return this.pinchZoom.moveY;
    }
  
    get isZoomedIn() {
      return this.scale > 0.1;
    }
  
    get scaleLevel() {
      return Math.round(this.scale / (this.properties['zoomControlScale'] || 1));
    }
  
    get maxScale() {
      return this.pinchZoom.maxScale;
    }
  
    get isZoomLimitReached() {
      return this.scale >= this.maxScale;
    }
  
    constructor(private elementRef: ElementRef) {
      this.applyOptionsDefault(defaultProperties, {});
    }
  
    ngOnInit() {
      this.initPinchZoom();
  
      /* Calls the method until the image size is available */
      this.pollLimitZoom();
    }
  
    ngOnChanges(changes: any) {
      let changedOptions = this.getProperties(changes);
      changedOptions = this.renameProperties(changedOptions);
  
      this.applyOptionsDefault(defaultProperties, changedOptions);
    }
  
    ngOnDestroy() {
      this.destroy();
    }
  
    initPinchZoom() {
      if (this.properties['disabled']) {
        return;
      }
  
      this.zoomControlPositionClass = this.getZoomControlPositionClass();
      this.properties['element'] = this.elementRef.nativeElement.querySelector(
        '.pinch-zoom-content'
      );
      this.properties['eventHandler'] = this.events;
      this.pinchZoom = new IvyPinch(this.properties);
    }
  
    getProperties(changes: any) {
      let properties = {} as any;
  
      for (var prop in changes) {
        if (prop !== 'properties') {
          properties[prop] = changes[prop].currentValue;
        }
        if (prop === 'properties') {
          properties = changes[prop].currentValue;
        }
      }
      return properties;
    }
  
    renameProperties(options: any) {
      for (var prop in options) {
        if (backwardCompatibilityProperties[prop as keyof typeof backwardCompatibilityProperties]) {
          options[backwardCompatibilityProperties[prop as keyof typeof backwardCompatibilityProperties]] = options[prop as keyof typeof backwardCompatibilityProperties];
          delete options[prop as keyof typeof backwardCompatibilityProperties];
        }
      }
  
      return options;
    }
  
    applyOptionsDefault(defaultOptions: any, options: any): void {
      this.properties = Object.assign({}, defaultOptions, options);
    }
  
    toggleZoom() {
      this.pinchZoom.toggleZoom();
    }
  
    isControl(mode: 'one-button' | 'two-buttons') {
      if (this.isDisabled) {
        return false;
      }
  
      if (this.properties['disableZoomControl'] === 'disable') {
        return false;
      }
  
      if (
        this.isTouchScreen &&
        this.properties['disableZoomControl'] === 'auto'
      ) {
        return false;
      }
  
      return this.properties['zoomControl'] === mode;
    }
  
    getZoomControlPositionClass() {
      const prefix = 'pz-zoom-control-position-';
  
      if (this.properties['zoomControlPosition']) {
        return prefix + this.properties['zoomControlPosition'];
      }
  
      if (this.properties['zoomControl'] === 'one-button') {
        return prefix + 'bottom';
      }
  
      if (this.properties['zoomControl'] === 'two-buttons') {
        return prefix + 'right';
      }

      return;
    }
  
    pollLimitZoom() {
      this.pinchZoom.pollLimitZoom();
    }
  
    public setTransform(properties: {
      x?: number;
      y?: number;
      scale?: number;
      transitionDuration?: number;
    }) {
      this.pinchZoom.setTransform(properties);
    }
  
    public setZoom(properties: { scale: number; center?: number[] }) {
      this.pinchZoom.setZoom(properties);
    }
  
    public zoomIn() {
      if (this.isZoomLimitReached) {
        return;
      }
  
      let newScale = this.scale + this.properties['zoomControlScale'];
  
      if (newScale > this.maxScale) {
        newScale = this.maxScale;
      }
      this.setZoom({
        scale: newScale
      });
    }
  
    public zoomOut() {
      if (this.scale <= 1) {
        return;
      }
  
      let newScale = this.scale - (this.properties['zoomControlScale'] || 0);
  
      if (newScale <= 1) {
        this.reset();
      } else {
        this.setZoom({
          scale: newScale
        });
      }
    }
  
    public reset() {
      this.pinchZoom.resetScale();
    }
  
    public destroy() {
      this.pinchZoom.destroy();
    }
  }
  