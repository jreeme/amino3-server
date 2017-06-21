webpackJsonp([3,11],{

/***/ 801:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__(18);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__app_translation_module__ = __webpack_require__(194);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__theme_nga_module__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__plugin_uploader_component__ = __webpack_require__(819);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__plugin_uploader_routing__ = __webpack_require__(842);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__components_pluginTable_pluginTable_component__ = __webpack_require__(841);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PluginUploaderModule", function() { return PluginUploaderModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};








var PluginUploaderModule = (function () {
    function PluginUploaderModule() {
    }
    return PluginUploaderModule;
}());
PluginUploaderModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["NgModule"])({
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_common__["c" /* CommonModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */],
            __WEBPACK_IMPORTED_MODULE_3__app_translation_module__["a" /* AppTranslationModule */],
            __WEBPACK_IMPORTED_MODULE_4__theme_nga_module__["a" /* NgaModule */],
            __WEBPACK_IMPORTED_MODULE_6__plugin_uploader_routing__["a" /* routing */]
        ],
        declarations: [
            __WEBPACK_IMPORTED_MODULE_5__plugin_uploader_component__["a" /* PluginUploader */],
            __WEBPACK_IMPORTED_MODULE_7__components_pluginTable_pluginTable_component__["a" /* PluginTable */]
        ],
        providers: []
    })
], PluginUploaderModule);

//# sourceMappingURL=plugin-uploader.module.js.map

/***/ }),

/***/ 819:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_postal_service__ = __webpack_require__(191);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__globals__ = __webpack_require__(138);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PluginUploader; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var PluginUploader = (function () {
    function PluginUploader(postalService) {
        this.postalService = postalService;
        this.fileUploaderOptions = {
            url: '/upload',
        };
    }
    PluginUploader.prototype.rebuildClient = function () {
        this.postalService.publish('System', 'RebuildClient', {}, __WEBPACK_IMPORTED_MODULE_2__globals__["b" /* PublishTarget */].server);
    };
    return PluginUploader;
}());
PluginUploader = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
        selector: 'plugin-uploader',
        styles: [__webpack_require__(856)],
        template: __webpack_require__(871)
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */]) === "function" && _a || Object])
], PluginUploader);

var _a;
//# sourceMappingURL=plugin-uploader.component.js.map

/***/ }),

/***/ 841:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_postal_service__ = __webpack_require__(191);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__globals__ = __webpack_require__(138);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return PluginTable; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var PluginTable = (function () {
    function PluginTable(postalService) {
        this.postalService = postalService;
        this.pluginTableData = [];
        var me = this;
        me.postalService.subscribe('PluginTable', 'PluginList', function (pluginTableData) {
            me.pluginTableData = pluginTableData;
        });
    }
    PluginTable.prototype.ngAfterViewInit = function () {
        this.postalService.publish('PluginManager', 'GetPluginList', {}, __WEBPACK_IMPORTED_MODULE_2__globals__["b" /* PublishTarget */].server);
    };
    return PluginTable;
}());
PluginTable = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
        selector: 'plugin-table',
        template: __webpack_require__(870)
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */]) === "function" && _a || Object])
], PluginTable);

var _a;
//# sourceMappingURL=pluginTable.component.js.map

/***/ }),

/***/ 842:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__plugin_uploader_component__ = __webpack_require__(819);
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return routing; });


// noinspection TypeScriptValidateTypes
var routes = [
    {
        path: '',
        component: __WEBPACK_IMPORTED_MODULE_1__plugin_uploader_component__["a" /* PluginUploader */],
        children: []
    }
];
var routing = __WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* RouterModule */].forChild(routes);
//# sourceMappingURL=plugin-uploader.routing.js.map

/***/ }),

/***/ 856:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(6)(false);
// imports


// module
exports.push([module.i, "@media screen and (min-width: 1620px) {\n  .row.shift-up > * {\n    margin-top: -573px; } }\n\n@media screen and (max-width: 1620px) {\n  .card.feed-panel.large-card {\n    height: 824px; } }\n\n.user-stats-card .card-title {\n  padding: 0 0 15px; }\n\n.blurCalendar {\n  height: 475px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ 870:
/***/ (function(module, exports) {

module.exports = "<div class=\"horizontal-scroll\">\n  <table class=\"table table-condensed\">\n    <thead>\n    <tr>\n      <th class=\"table-id\">#</th>\n      <th>Plugin Name</th>\n    </tr>\n    </thead>\n    <tbody>\n    <tr *ngFor=\"let item of pluginTableData\">\n      <td class=\"table-id\">{{ item.pluginId }}</td>\n      <td>{{ item.pluginName }}</td>\n    </tr>\n    </tbody>\n  </table>\n</div>\n"

/***/ }),

/***/ 871:
/***/ (function(module, exports) {

module.exports = "<div class=\"widgets\">\n  <div class=\"row\">\n    <div class=\"col-md-6\">\n      <ba-card title=\"Plugin Uploader\" baCardClass=\"with-scroll\">\n        <ba-file-uploader [fileUploaderOptions]=\"fileUploaderOptions\"></ba-file-uploader>\n        <div class=\"button-wrapper\">\n          <button type=\"button\" class=\"btn btn-warning pull-right\" (click)=\"rebuildClient()\">Rebuild Client</button>\n        </div>\n      </ba-card>\n    </div>\n<!--    <div class=\"col-md-6\">\n      <ba-card title=\"Plugin Uploader\" baCardClass=\"with-scroll\">\n        <iframe src=\"/dashboard\" frameborder=\"0\" width=\"100%\" height=\"100%\"></iframe>\n      </ba-card>\n    </div>-->\n  </div>\n  <div class=\"row\">\n    <div class=\"col-lg-6 col-md-12\">\n      <ba-card title=\"Plugins\" baCardClass=\"with-scroll table-panel\">\n        <plugin-table></plugin-table>\n      </ba-card>\n    </div>\n  </div>\n</div>\n"

/***/ })

});
//# sourceMappingURL=3.chunk.js.map