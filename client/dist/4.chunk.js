webpackJsonp([4,11],{

/***/ 802:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__mosaic_routing__ = __webpack_require__(843);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__mosaic_component__ = __webpack_require__(820);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__theme_nga_module__ = __webpack_require__(192);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__ng2_components_webpage_webpage_module__ = __webpack_require__(807);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MosaicModule", function() { return MosaicModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};






//noinspection JSUnusedGlobalSymbols
var MosaicModule = (function () {
    function MosaicModule() {
    }
    return MosaicModule;
}());
MosaicModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["NgModule"])({
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_common__["c" /* CommonModule */],
            __WEBPACK_IMPORTED_MODULE_5__ng2_components_webpage_webpage_module__["a" /* WebPageModule */],
            __WEBPACK_IMPORTED_MODULE_4__theme_nga_module__["a" /* NgaModule */],
            __WEBPACK_IMPORTED_MODULE_2__mosaic_routing__["a" /* routing */]
        ],
        declarations: [
            __WEBPACK_IMPORTED_MODULE_3__mosaic_component__["a" /* Mosaic */]
        ],
        providers: []
    })
], MosaicModule);

//# sourceMappingURL=mosaic.module.js.map

/***/ }),

/***/ 806:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_services_postal_service__ = __webpack_require__(191);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_platform_browser__ = __webpack_require__(50);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WebPage; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var WebPage = (function () {
    function WebPage(postalService, sanitizer) {
        this.postalService = postalService;
        this.sanitizer = sanitizer;
    }
    Object.defineProperty(WebPage.prototype, "sourceUrl", {
        set: function (newSourceUrl) {
            this.sanitizedSourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(newSourceUrl);
        },
        enumerable: true,
        configurable: true
    });
    return WebPage;
}());
__decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Input"])('sourceUrl'),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [String])
], WebPage.prototype, "sourceUrl", null);
WebPage = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
        selector: 'webpage',
        template: "\n    <iframe [src]=\"sanitizedSourceUrl\" frameborder=\"0\" width=\"100%\" height=\"740px\"></iframe>\n  "
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__app_services_postal_service__["a" /* PostalService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__app_services_postal_service__["a" /* PostalService */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__angular_platform_browser__["d" /* DomSanitizer */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_2__angular_platform_browser__["d" /* DomSanitizer */]) === "function" && _b || Object])
], WebPage);

var _a, _b;
//# sourceMappingURL=webpage.component.js.map

/***/ }),

/***/ 807:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__webpage_component__ = __webpack_require__(806);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return WebPageModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};


var WebPageModule = (function () {
    function WebPageModule() {
    }
    return WebPageModule;
}());
WebPageModule = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["NgModule"])({
        declarations: [
            __WEBPACK_IMPORTED_MODULE_1__webpage_component__["a" /* WebPage */]
        ],
        exports: [
            __WEBPACK_IMPORTED_MODULE_1__webpage_component__["a" /* WebPage */]
        ]
    })
], WebPageModule);

//# sourceMappingURL=webpage.module.js.map

/***/ }),

/***/ 820:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_postal_service__ = __webpack_require__(191);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Mosaic; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var Mosaic = (function () {
    //noinspection JSUnusedLocalSymbols
    function Mosaic(postalService) {
        this.postalService = postalService;
        this.sourceUrl = '/dashboard';
    }
    return Mosaic;
}());
Mosaic = __decorate([
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["Component"])({
        selector: 'mosaic',
        template: "\n    <webpage [sourceUrl]=\"sourceUrl\"></webpage>\n<!--    <ba-card title=\"Mosaic\">-->\n<!--      <iframe src=\"/dashboard\" frameborder=\"0\" width=\"100%\" height=\"740px\"></iframe>-->\n<!--    </ba-card>-->\n  "
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_postal_service__["a" /* PostalService */]) === "function" && _a || Object])
], Mosaic);

var _a;
//# sourceMappingURL=mosaic.component.js.map

/***/ }),

/***/ 843:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_router__ = __webpack_require__(27);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__mosaic_component__ = __webpack_require__(820);
/* unused harmony export routes */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return routing; });


// noinspection TypeScriptValidateTypes
var routes = [
    {
        path: '',
        component: __WEBPACK_IMPORTED_MODULE_1__mosaic_component__["a" /* Mosaic */],
        children: []
    }
];
var routing = __WEBPACK_IMPORTED_MODULE_0__angular_router__["a" /* RouterModule */].forChild(routes);
//# sourceMappingURL=mosaic.routing.js.map

/***/ })

});
//# sourceMappingURL=4.chunk.js.map