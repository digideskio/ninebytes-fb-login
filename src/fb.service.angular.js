(function(angular) {
	'use strict';

	var app = angular.module('ninebytes.fb.services', []);

	var FacebookLoginService = function($q, $timeout, config) {
		var service = this;

		this.ctrlScope = {};

		this.loading = false;
		this.loadingMessage = '';

		// 'not-ready', 'ready', 'not_authorized', 'connected'
		this.status = 'not_ready';
		this.me = null;
		this.permissions = null;
		this.picture = null;
		this.authResponse = null;

		var checkLoginState = function() {
			service.loading = true;
			service.loadingMessage = 'Checking login status...';
			FB.getLoginStatus(function(response) {
				statusChangeCallback(response);
			});
		};

		var getPermissions = function() {
			var deferred = $q.defer();
			FB.api('/me/permissions', function(response) {
				service.permissions = response;
				deferred.resolve();
			});
			return deferred.promise;
		}

		var getMe = function() {
			var deferred = $q.defer();
			FB.api('/me', function(response) {
				service.me = response;
				deferred.resolve();
			});
			return deferred.promise;
		};

		var getPicture = function() {
			var deferred = $q.defer();
			FB.api('/me/picture', function(response){
				service.picture = response.data;
				deferred.resolve();
			});
			return deferred.promise;
		};

		var statusChangeCallback = function(response) {
			service.status = response.status;
			service.authResponse = response;

			var readyCallback = function() {
				$timeout(function() {
					if (config.DEBUG) {
						console.log('me:', service.me);
						console.log('status:', service.status);
						console.log('permissions:', service.permissions);
						console.log('picture:', service.picture);
						console.log('authResponse:', service.authResponse);
					}
					service.resetLoading();
				});
			}

			if (service.status === 'connected') {
				getMe().then(getPermissions).then(getPicture).then(readyCallback);
			} else {
				readyCallback();
			}

		};

		var resetService = function() {
			service.me = null;
			service.permissions = null;
			service.authResponse = null;
		};

		this.init = function(ctrlScope) {
			service.ctrlScope = ctrlScope;
			service.setLoading('Initialising authentication...');
			FB.init({ appId: config.APP_ID, cookie: true, xfbml: true, version: 'v2.0'});
			FB.getLoginStatus(function(response) {
				statusChangeCallback(response);
			});
		};

		this.login = function() {
			service.setLoading('Attempting to login...');
			FB.login(function(response){
				statusChangeCallback(response);
			}, {scope: config.PERMISSIONS});
		};

		this.logout = function() {
			service.setLoading('Logging you out...');
			FB.logout(function(response) {
				resetService();
				statusChangeCallback(response);
			});
		};

		this.setLoading = function(message, apply) {
			service.loading = true;
			service.loadingMessage = message;
		};

		this.resetLoading = function() {
			service.loading = false;
			service.loadingMessage = '';
		};

	};

	FacebookLoginService.$inject = ['$q', '$timeout', 'FacebookLoginConfig'];

	app.service('FacebookLoginService', FacebookLoginService);

})(this.angular);
