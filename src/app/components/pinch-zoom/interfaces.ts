export interface Properties {
    "transition-duration"?: number;
    "double-tap"?: boolean;
    "double-tap-scale"?: number;
    "auto-zoom-out"?: boolean;
    "limit-zoom"?: number | "original image size";
    "disabled"?: number;
    "element"?: string;
    "disablePan"?: boolean;
    "overflow"?: "hidden" | "visible";
    "zoomControlScale"?: number;
    "zoomControl"?: "one-button" | "two-buttons";
    "disableZoomControl"?: "disable" | "never" | "auto";
    "backgroundColor"?: string;
    "zoomControlPosition"?: "right" | "right-bottom" | "bottom";
    "limitPan"?: boolean;
    "minPanScale"?: number;
    "minScale"?: number;
    "eventHandler"?: any;
    "listeners"?: "auto" | "mouse and touch";
    "wheel"?: boolean;
    "fullImage"?: {
        path: string,
        minScale?: number
    };
    "autoHeight"?: boolean;
    "wheelZoomFactor"?: number;
    "draggableImage"?: boolean;
}