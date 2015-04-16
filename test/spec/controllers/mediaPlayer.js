'use strict';

describe('Controller: MediaPlayerCtrl', function () {

  // load the controller's module
  beforeEach(module('wblwrld3App'));

  var MediaPlayerCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
      MediaPlayerCtrl = $controller('MediaPlayerCtrl', {
      $scope: scope
    });
  }));

    it('should not find notexisting in the scope', function () {
        expect(scope.notexisting).toBeUndefined();
    });
});
