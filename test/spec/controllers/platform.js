'use strict';

describe('Controller: PlatformCtrl', function () {

    // load the controller's module
    beforeEach(module('wblwrld3App'));

    var PlatformCtrl,
        scope;

    // Initialize the controller and a mock scope
    beforeEach(inject(function ($controller, $rootScope, $log) {
        scope = $rootScope.$new();
        PlatformCtrl = $controller('PlatformCtrl', {
            $scope: scope
        });
    }));

    it('should have a list of adminUsers in the scope', function () {
        expect(scope.adminUsers.length).toBe(3);
    });
});
