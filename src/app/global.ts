export const global = {
    subtitle : '',
    rootParam : null,
    setSubtitle : function(data: any) {
        this.subtitle = data;
    },
    getSubtitle : function() {
        return this.subtitle;
    },
    setRootParam : function(data: any) {
        this.rootParam = data;
    },
    getRootParam : function() {
        return this.rootParam;
    }
};
