import axios from 'axios';
import { Utils } from 'k-utils-js';

export class Api {

  static setDefaultHeaders(){
    let csrfMetaTag = document.querySelector('meta[name="csrf-token"]');

    if(csrfMetaTag) {
      axios.defaults.headers.common['X-CSRF-Token'] = csrfMetaTag.content;
    }
    axios.defaults.headers.common['Accept'] = 'application/json';
    axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
  }

  static setCancelToken(url) {
    const tokenSource = this.getCancelToken(url);
    if (!Utils.isBlank(tokenSource)) {
      tokenSource.cancel(`${url} request canceled by the user.`);
    }
    this.cancelTokenSources[url] = axios.CancelToken.source();
  }

  static getCancelToken(url) {
    return this.cancelTokenSources[url];
  }

  static later(delay, value) {
    return new Promise(function(resolve) {
      setTimeout(resolve, delay, value);
    });
  }

  static axiosRequest({onSuccess, onError, ...other}){
    return new Promise((resolve) =>
      axios(other)
      .then(response => {
        onSuccess(response);
        resolve();
      })
      .catch(response => {
        onError(response);
        resolve();
      })
    );
  }

  static sendRequest({delay, url, ...other}) {
    this.setDefaultHeaders();
    this.setCancelToken(url);

    let cancelToken = this.getCancelToken(url).token;

    let axiosArguments = Object.assign(other, {
      url: url,
      cancelToken: cancelToken,
    });

    let delay_in_ms = 300;

    if (window && window.AppInfo && AppInfo.railsEnv === 'test') {
      delay_in_ms = 0;
    }

    if (Utils.isTruthy(delay) && delay_in_ms > 0) {
      return this.later(delay_in_ms, axiosArguments).then(this.axiosRequest);
    } else {
      return this.axiosRequest(axiosArguments);
    }
  }
}

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

window.Api = Api;
