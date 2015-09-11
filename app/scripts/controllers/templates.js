//
// Webble World 3.0 (IntelligentPad system for the web)
//
// Copyright (c) 2010-2015 Micke Nicander Kuwahara, Giannis Georgalis, Yuzuru Tanaka
//     in Meme Media R&D Group of Hokkaido University, Japan. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Additional restrictions may apply. See the LICENSE file for more information.
//

'use strict';

/**
 * Controller for the template creation component (which is also a rudimentary IDE)
 *
 * @author Giannis Georgalis <jgeorgal@meme.hokudai.ac.jp>
 */
ww3Controllers.controller('TemplatesCtrl', ['$scope', '$timeout', 'gettext', 'templates', 'templateService', 'confirm',
function ($scope, $timeout, gettext, templates, templateService, confirm) {

    ////////////////////////////////////////////////////////////////////
    // Utility functions
    //
    function processFilesToUpload(files) {

        files = files || $scope.filesToUpload;

        var archivesIncluded = false;
        for (var i = 0; i < files.length; ++i) {

            var f = files[i];

            if (f.name.lastIndexOf(".war") != -1)
                archivesIncluded = true;
        }
        $scope.filesToUploadAreArchives = archivesIncluded;
    }

    function mergeTemplate(t) {

        var handledTemplate = false;
        for (var i = 0; i < $scope.templates.length; ++i) {

            if ($scope.templates[i].id === t.id) {

                //$scope.templates[i] = t; // This doesn't trigger a changed event...
                angular.copy(t, $scope.templates[i]);

                // After the update try to keep the previous state intact to not interrupt Jonas' workflow
                if ($scope.currTemplateId === t.id)
                    $scope.filesUploaded = $scope.templates[i].files;

                //$scope.resetSelectedFile();
                handledTemplate = true;
                break;
            }
        }

        if (!handledTemplate)
            $scope.templates.push(t);
    }

    ////////////////////////////////////////////////////////////////////
    // Properties and main functionality
    //

	// Existing templates
	//
	$scope.templates = templates;
	$scope.currTemplateId = null;

	// Manipulation of template files
	//
	$scope.filesToUpload = [];
	$scope.filesToUploadAreArchives = false;

	$scope.onFilesAdded = function(files) {
        
	    var updatedFiles = $scope.filesToUpload.concat(files);
	    processFilesToUpload(updatedFiles);
	    $scope.filesToUpload = !$scope.filesToUploadAreArchives ? updatedFiles :
	        updatedFiles.filter(function (f) { return f.name.lastIndexOf(".war") != -1 });
	};
	$scope.onFileRemoved = function (index) {

	    $scope.filesToUpload.splice(index, 1);
	    processFilesToUpload();
	};
	$scope.onFilesCleared = function() {

		$scope.filesToUpload.length = 0;
		processFilesToUpload();
		angular.element(document.getElementById('selectMultipleFilesInputEntry')).val('');
	};

	// Other form data and functions
	//
	$scope.templateData = {};
	$scope.filesUploaded = [];
	$scope.importPrefsData = {};

	$scope.selectTemplate = function(t) {

		if ($scope.currFileDirty)
			return;
		$scope.resetSelectedFile();

		if (!t || ($scope.currTemplateId && $scope.currTemplateId === t.id)) {

			$scope.currTemplateId = null;

			$scope.templateData = {};
			$scope.filesUploaded = [];
		}
		else {

			$scope.currTemplateId = t.id;

			$scope.templateData.id = t.webble.templateid;
			$scope.templateData.name = t.webble.displayname;
			$scope.templateData.description = t.webble.description;

			$scope.filesUploaded = t.files;
		}
	};

	$scope.deleteTemplate = function(t) {
		$scope.formDeleteTemplate();
	};

	//******************************************************************

	$scope.queryTemplates = function(qid) {
		return templateService.queryById(qid).then(function(resp) { return resp.data; });
	};

	$scope.onSelectQueriedTemplate = function(t) {

		if ($scope.duringTimeout)
			$timeout.cancel($scope.duringTimeout);

		$scope.duringTimeout = $timeout(function () {

			if (!$scope.currTemplateId && $scope.templateData.id === t.id) {

				$scope.templateData.id = t.id;
				$scope.templateData.name = t.name;
				$scope.templateData.description = t.description;

				$scope.enableCopyTemplate = true;
			}
			delete $scope.duringTimeout;

		}, 2000);
	};

	//******************************************************************

	$scope.$watch('templateData.id', function(newValue, oldValue) {

		$scope.enableCopyTemplate = false;

		if (!newValue || newValue.length < 4)
			return;

		for (var i = 0; i < $scope.templates.length; ++i) {

			if ($scope.templates[i].webble.templateid === newValue) {

				if (!$scope.currTemplateId || $scope.currTemplateId !== $scope.templates[i].id)
					$scope.selectTemplate($scope.templates[i]);
				break;
			}
		}
	});

	////////////////////////////////////////////////////////////////////
	// Editing functionality
	//
	function getMode(f) {

		var mode = f.substr(f.lastIndexOf('.') + 1).toLowerCase();
		return mode == 'js' ? 'javascript' : mode == 'md' ? 'markdown' : mode == 'txt' ? 'text' : mode;
	}

	$scope.editorLoaded = function(editor) {

		$scope.editor = editor;

		// Configure editor the old-fashioned way...
		editor.setFontSize(14);
		editor.setHighlightActiveLine(true);
		editor.setAutoScrollEditorIntoView(true);
		editor.$blockScrolling = Infinity; // to disable ace warning
/*
		editor.setOption("minLines", 50);
		editor.setOption("maxLines", 50);
*/

		// Global behavior
		//
		editor.on('change', $scope.modifiedFile);

		editor.commands.addCommand({
			name: "save",
			bindKey: {win: "Ctrl-S", mac: "Command-S"},
			exec: $scope.saveFile
		});

		if ($scope.currFileContent) {

			var session = editor.getSession();
			session.setMode('ace/mode/' + $scope.currFileMode);
			session.setValue($scope.currFileContent);

			$scope.currFileDirty = $scope.currFileNew;
		}
	};

	$scope.resetSelectedFile = function() {

		$scope.currFile = null;
		$scope.currFileMode = null;
		$scope.currFileHandler = null;
		$scope.currFileContent = null;

		$scope.currFileDirty = false;
		$scope.currFileNew = false;
	};

	$scope.selectFile = function(f) {

		if ($scope.currFile === f || $scope.currFileDirty)
			return;

		var mode = getMode(f);

		$scope.resetSelectedFile();
		$scope.currFile = f;
		$scope.currFileMode = mode;

		switch(mode) {
			case 'jpg':
			case 'png':
			case 'gif':
			case 'tiff':
			case 'bmp':
				$scope.currFileHandler = "imageViewer";
				$scope.currFileContent = templateService.toUrl($scope.currTemplateId, f);
				break;
			case 'javascript':
			case 'html':
			case 'css':
			case 'json':
			case 'markdown':
			case 'text':
				templateService.getFile($scope.currTemplateId, f).then(function(resp) {

					$scope.currFileHandler = "editor";
					$scope.currFileContent = resp.data.content;
				});
				break;
			default:
				$scope.currFileHandler = "external";
				$scope.currFileContent = templateService.toUrl($scope.currTemplateId, f);
		}
	};

	$scope.newTemplateFiles = [
		{ name: 'view.html', help: gettext("How the Webble view is structured") },
		{ name: 'styles.css', help: gettext("How the Webble looks") },
		{ name: 'controllers.js', help: gettext("All your controller are belong to us") },
		{ name: 'directives.js', help: gettext("All your directive are belong to us") },
		{ name: 'filters.js', help: gettext("All your filter are belong to us") },
		{ name: 'services.js', help: gettext("All your service are belong to us") },
		{ name: 'manifest.json', help: gettext("Define external dependencies") },
		{ name: 'README.md', help: gettext("Write something that nobody will read, MD-style!") }
	];

	$scope.missingFile = function(fValue) {
		return $scope.filesUploaded.indexOf(fValue.name) === -1;
	};

	$scope.createFile = function(f) {

		$scope.resetSelectedFile();

		templateService.getBoilerplate(f).then(function(resp) {

			$scope.currFile = f;
			$scope.currFileMode = getMode(f);
			$scope.currFileHandler = "editor";
			$scope.currFileContent = resp.data;
			$scope.currFileNew = true;

			$scope.filesUploaded.push($scope.currFile);
		});
	};

	$scope.removeFile = function() {

		var index = $scope.filesUploaded.indexOf($scope.currFile);
		if (index != -1) {
			$scope.filesUploaded.splice(index, 1);
			$scope.resetSelectedFile();
		}
	};

	$scope.deleteFile = function() {

		confirm.show(gettext("Delete File Confirmation"),
			gettext("Are you sure you want to permanently delete the template file: ") + $scope.currFile,
			gettext("Delete"), gettext("Do Not Delete")).then(function () {

				templateService.deleteFile($scope.currTemplateId, $scope.currFile)
					.then($scope.removeFile);
			});
	};

	$scope.modifiedFile = function() {
		$scope.currFileDirty = !$scope.currFileDirty || $scope.currFileNew || $scope.editor.getSession().getUndoManager().hasUndo();
	};
	$scope.saveFile = function() {

		templateService.updateFile($scope.currTemplateId, $scope.currFile, $scope.editor.getValue())
			.then(function(resp) {

				$scope.currFileNew = false;
				$scope.currFileDirty = false;
			});
	};
	$scope.discardFileChanges = function() {

		if ($scope.currFileNew)
			$scope.removeFile();
		else
			$scope.currFileDirty = false;
	};

	////////////////////////////////////////////////////////////////////
	// Functionality for the form buttons
	//
	$scope.formDefaultAction = function() {

		if ($scope.currTemplateId)
			$scope.formUpdateTemplate();
		else if ($scope.templateData.id)
			$scope.formCreateTemplate();
	};

	$scope.formCreateTemplate = function() {

		templateService.create($scope.filesToUpload, $scope.templateData)
			.then(function(resp) {

				//$scope.$close(gettext("Successfully created template"));
				var t = resp.data;
				$scope.templates.push(t);

				$scope.onFilesCleared();
				$scope.selectTemplate(t);
			},
			function(response) {
				$scope.serverErrorMessage = response.data;
			},
			function(evt) {
				//$scope.uploadPercentage = Math.floor((100 * evt.loaded) / evt.total);
			});
	};

	$scope.formUpdateTemplate = function() {

		if (!$scope.currTemplateId)
			return;

		var id = $scope.currTemplateId;

		templateService.update(id, $scope.filesToUpload, $scope.templateData)
			.then(function(response) {

				mergeTemplate(response.data);
				$scope.onFilesCleared();
//				$scope.selectTemplate(null);
			},
			function(response) {
				$scope.serverErrorMessage = response.data;
			},
			function(evt) {
				//$scope.uploadPercentage = Math.floor((100 * evt.loaded) / evt.total);
			});
	};

	$scope.formDeleteTemplate = function(publish) {

		if (!$scope.currTemplateId)
			return;

		confirm.show(gettext("Delete Template Confirmation"),
			gettext("Are you sure you want to permanently delete the selected template and all its files?"),
			gettext("Delete"), gettext("Do Not Delete")).then(function () {

				var id = $scope.currTemplateId;
				(!publish ? templateService.clearFiles(id) : templateService.publish(id))
					.then(function () {

						for (var i = 0; i < $scope.templates.length; ++i) {
							if ($scope.templates[i].id === id) {
								$scope.templates.splice(i, 1);
								break;
							}
						}
						$scope.selectTemplate(null);
						$scope.filesUploaded.length = 0;
					},
					function (response) {
						$scope.serverErrorMessage = response.data;
					});
			});
	};

	$scope.formCopyTemplate = function(defid) {

		templateService.copy(defid)
			.then(function(resp) {

				var t = resp.data;
				$scope.templates.push(t);
				$scope.selectTemplate(t);

				$scope.enableCopyTemplate = false;
			},
			function(response) {
				$scope.serverErrorMessage = response.data;
			});
	};

	//******************************************************************

	$scope.formImportTemplate = function () {

		if ($scope.filesToUploadAreArchives) {

		    templateService.importArchive($scope.filesToUpload, $scope.importPrefsData).then(function (resp) {

		        resp.data.forEach(mergeTemplate);
		        $scope.onFilesCleared();
		        //$scope.selectTemplate(null);
				$scope.filesToUploadAreArchives = false;
		    },
			function(resp) {
			    $scope.serverErrorMessage = resp.data;
			});
		}
	};
	$scope.formExportTemplatesUrl = templateService.exportArchiveUrl;

}]);
