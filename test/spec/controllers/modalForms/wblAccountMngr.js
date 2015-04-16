'use strict';

describe('Controller: WblAccountMngrCtrl', function () {

  // load the controller's module
  beforeEach(module('wblwrld3App'));

  var WblAccountMngrCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    WblAccountMngrCtrl = $controller('WblAccountMngrCtrl', {
      $scope: scope
    });
  }));

    it('should not find notexisting in the scope', function () {
        expect(scope.notexisting).toBeUndefined();
    });
});
