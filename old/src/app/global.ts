import { ViewController } from 'ionic-angular';

export const global = {
    subtitle : '',
    rootParam : null,
    setSubtitle : function(data) {
        this.subtitle = data;
    },
    getSubtitle : function() {
        return this.subtitle;
    },
    setRootParam : function(data) {
        this.rootParam = data;
    },
    getRootParam : function() {
        return this.rootParam;
    }
};
