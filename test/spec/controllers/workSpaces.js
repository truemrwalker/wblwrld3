'use strict';

describe('Controller: WorkSurfaceCtrl', function () {

  // load the controller's module
  beforeEach(module('wblwrld3App'));

  var WorkSurfaceCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
      WorkSurfaceCtrl = $controller('WorkSurfaceCtrl', {
      $scope: scope
    });
  }));

  it('should not find notexisting in the scope', function () {
    expect(scope.notexisting).toBeUndefined();
  });
});
