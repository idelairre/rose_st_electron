import axios from 'axios';
import { Inject } from 'ng-forward';
import ModalService from '../services/modal.service';

@Inject('$state', '$window', ModalService)
class HttpInterceptor {
	constructor($state, $window, ModalService) {
    this.$state = $state;
		this.$window = $window;
    this.modalService = ModalService;

		axios.interceptors.request.use((config) => {
      console.log(config);
      this.modalService.loadingModal();
      return config;
		}, (error) => {
      console.log(error);
      this.modalService.hide();
			return Promise.reject(error);
		});

    axios.interceptors.response.use((response) => {
    	console.log(response);
    	this.modalService.hide();
    	return response;
    }, (error) => {
    	this.modalService.hide();
    	this.modalService.error(error.statusText);
    	return Promise.reject(error);
    });

		$window.addEventListener('loginStarted', ::this.modalService.loadingModal);
		$window.addEventListener('loginSuccess', ::this.modalService.hide);
		$window.addEventListener('loginFailed', ::this.modalService.hide);
		$window.addEventListener('analyticsRequest', ::this.modalService.loadingModal);
		$window.addEventListener('analyticsReply', ::this.modalService.hide);
		$window.addEventListener('analyticsError', ::this.modalService.hide);
  }

  @Inject('$state', '$window', ModalService)
  static init($state, $window, ModalService) {
    HttpInterceptor.instance = new HttpInterceptor($state, $window, ModalService);
    return HttpInterceptor.instance;
  }
}

export default angular.module('roseStAdmin.interceptor', ['ui.router']).run(HttpInterceptor.init);
