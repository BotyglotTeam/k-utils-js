'use strict';Object.defineProperty(exports,'__esModule',{value:true});function _interopDefault(e){return(e&&(typeof e==='object')&&'default'in e)?e['default']:e}var axios=_interopDefault(require('axios')),kUtilsJs=require('k-utils-js'),moment=_interopDefault(require('moment'));function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

var Api = function Api () {};

Api.setDefaultHeaders = function setDefaultHeaders (){
  var csrfMetaTag = document.querySelector('meta[name="csrf-token"]');

  if(csrfMetaTag) {
    axios.defaults.headers.common['X-CSRF-Token'] = csrfMetaTag.content;
  }
  axios.defaults.headers.common['Accept'] = 'application/json';
  axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
};

Api.setCancelToken = function setCancelToken (url) {
  var tokenSource = this.getCancelToken(url);
  if (!kUtilsJs.Utils.isBlank(tokenSource)) {
    tokenSource.cancel((url + " request canceled by the user."));
  }
  this.cancelTokenSources[url] = axios.CancelToken.source();
};

Api.getCancelToken = function getCancelToken (url) {
  return this.cancelTokenSources[url];
};

Api.later = function later (delay, value) {
  return new Promise(function(resolve) {
    setTimeout(resolve, delay, value);
  });
};

Api.axiosRequest = function axiosRequest (ref){
    var onSuccess = ref.onSuccess;
    var onError = ref.onError;
    var rest = objectWithoutProperties( ref, ["onSuccess", "onError"] );
    var other = rest;

  return new Promise(function (resolve) { return axios(other)
    .then(function (response) {
      onSuccess(response);
      resolve();
    })
    .catch(function (response) {
      onError(response);
      resolve();
    }); }
  );
};

Api.sendRequest = function sendRequest (ref) {
    var delay = ref.delay;
    var url = ref.url;
    var rest = objectWithoutProperties( ref, ["delay", "url"] );
    var other = rest;

  this.setDefaultHeaders();
  this.setCancelToken(url);

  var cancelToken = this.getCancelToken(url).token;

  var axiosArguments = Object.assign(other, {
    url: url,
    cancelToken: cancelToken,
  });

  var delay_in_ms = 300;

  if (window && window.AppInfo && AppInfo.railsEnv === 'test') {
    delay_in_ms = 0;
  }

  if (kUtilsJs.Utils.isTruthy(delay) && delay_in_ms > 0) {
    return this.later(delay_in_ms, axiosArguments).then(this.axiosRequest);
  } else {
    return this.axiosRequest(axiosArguments);
  }
};

Api.cancelTokenSources = {};
Api.active = 0;

axios.interceptors.request.use(function (config) {
  Api.active += 1;
  return config;
}, function (error) {
  Api.active -= 1;
  return Promise.reject(error);
});

axios.interceptors.response.use(function(response) {
  Api.active -= 1;
  return response;
}, function(error) {
  Api.active -= 1;
  return Promise.reject(error);
});

window.Api = Api;var Utils = {
  isString: function(value){
    return (typeof value === "string")
  },
  isUndefined: function (value) {
    return (typeof value === 'undefined')
  },
  isUndefinedOrNull: function (value) {
    return (this.isUndefined(value) || value === null )
  },
  isEmpty: function(value) {
    if (this.isObject(value)) {
      // Object.keys({}).length === 0  |> true
      // Object.keys([]).length === 0  |> true
      return Object.keys(value).length === 0
    } else if (this.isString(value)) {
      return value.length === 0
    }
  },
  isNotEmpty: function (value) {
    return !this.isEmpty(value)
  },
  isBlank : function (value) {
    return this.isUndefinedOrNull(value) || this.isEmpty(value)
  },
  isFalsy : function (value) {
    return this.isBlank(value) || (value === false)
  },
  isTruthy : function(value) {
    return !this.isFalsy(value)
  },
  isUUID : function (value) {
    if (typeof value === "string") {
      return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    } else {
      return false
    }
  },
  toUnderscore: function (value) {
    if (typeof value === "string") {
      return value.replace(/([A-Z])/g, function($1){return "_"+$1.toLowerCase();})
    } else {
      return value
    }
  },
  toLowerCamelCase: function(value){
    if (typeof value === "string") {
      return value.replace(/(_[a-z])/g, function($1){return $1.toUpperCase().replace('_', '');})
    } else {
      return value
    }
  },
  isObject: function(value) {
    return (typeof value === "object")
  },
  isArray: function(value) {
    //source : http://stackoverflow.com/questions/767486/how-do-you-check-if-a-variable-is-an-array-in-javascript
    return (value.constructor === Array)
  },
  isFunction: function(value) {

    return (typeof value === "function")
  },
  noop: function () {
  },
  getMaxOfArray:function(numArray) {
    return Math.max.apply(null, numArray);
  },
  compareStrings: function(a,b){
    return a.localeCompare(b)
  },

  compareNumbers: function(a,b) {
    return a - b
  },

  generateIntegerHashFromString: function(str) {
    //source https://github.com/darkskyapp/string-hash
    var hash = 5381,
      i    = str.length;

    while(i)
      { hash = (hash * 33) ^ str.charCodeAt(--i); }

    /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
     * integers. Since we want the results to be always positive, convert the
     * signed int to an unsigned by doing an unsigned bitshift. */
    return hash >>> 0;

  },

  dateHasIsoFormat: function (str) {
    //equivalent to moment format YYYY-MM-DD
    return str.match(/^\d{4}[\-](0[1-9]|1[012])[\-](0[1-9]|[12][0-9]|3[01])$/)
  },

  dateTimeHasIsoFormat: function (str) {
    //equivalent to moment format YYYY-MM-DD HH:mm
    return str.match(/^\d{4}[\-](0[1-9]|1[012])[\-](0[1-9]|[12][0-9]|3[01]) ([01][0-9]|2[0-3]):([0-5][0-9])$/)
  },

  dateTimeHasStrictISO8601Format: function (string) {
    return !moment(string, "YYYY-MM-DD HH:mm", true).isValid()
  },

  dateHasCustomFormat: function (str) {
    //equivalent to moment format D/M/YYYY
    return str.match(/^(0?[1-9]|[12][0-9]|3[01])[\/](0?[1-9]|1[012])[\/]\d{4}$/)
  },
  dateTimeHasCustomFormat: function (str) {
    //equivalent to moment format D/M/YYYY H:mm
    return str.match(/^(0?[1-9]|[12][0-9]|3[01])[\/](0?[1-9]|1[012])[\/]\d{4} (0?[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/)
  },
  count:  function (from, to, increment, exclude) {
    if ( from === void 0 ) from = 0;
    if ( to === void 0 ) to = 1;
    if ( increment === void 0 ) increment = 1;
    if ( exclude === void 0 ) exclude = [];

    var array = [];
    for (var i = from; i <= to; i += increment) { !exclude.includes(i) && array.push(i); }
    return array;
  },

  compareBy: function(key) {

    return function compare(a, b) {
      if (a[key] < b[key] ) {
        return -1;
      }
      if (a[key] > b[key] ) {
        return 1;
      }

      return 0;
    }

  },

  dotify: function (str) {
    return (str.replace(/\[/g, '.').replace(/]/g,''))
  }
};/* eslint-disable import/prefer-default-export */var components=/*#__PURE__*/Object.freeze({__proto__:null,Api: Api,Utils: Utils});// Import vue components

// install function executed by Vue.use()
function install(Vue) {
  if (install.installed) { return; }
  install.installed = true;
  Object.keys(components).forEach(function (componentName) {
    Vue.component(componentName, components[componentName]);
  });
}

// Create module definition for Vue.use()
var plugin = {
  install: install,
};

// To auto-install when vue is found
/* global window global */
var GlobalVue = null;
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}exports.Api=Api;exports.Utils=Utils;exports.default=plugin;