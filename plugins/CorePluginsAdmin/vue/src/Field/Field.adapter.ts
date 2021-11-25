/*!
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { INgModelController, ITimeoutService } from 'angular';
import { nextTick, shallowRef } from 'vue';
import {
  createAngularJsAdapter,
  transformAngularJsBoolAttr,
  transformAngularJsIntAttr,
  processScopeProperty,
  Matomo,
  useExternalPluginComponent,
} from 'CoreHome';
import Field from './Field.vue';
import FieldAngularJsTemplate from '../FormField/FieldAngularJsTemplate.vue';

function handleJsonValue(value: unknown, varType: string, uiControl: string) {
  if (typeof value === 'string'
    && value
    && (varType === 'array'
      || uiControl === 'multituple'
      || uiControl === 'field-array'
      || uiControl === 'multiselect'
      || uiControl === 'site')
  ) {
    const result = JSON.parse(value);

    // the angularjs site field supplied siteid/sitename properties which initializes the
    // siteselector value. the sitename is assumed to be encoded, and is decoded once.
    // so the value for 'site' Field's in angularjs is assumed to be encoded.
    if (uiControl === 'site') {
      result.name = Matomo.helper.htmlDecode(result.name);
    }

    return result;
  }

  if (uiControl === 'checkbox' && varType !== 'array') {
    return transformAngularJsBoolAttr(value);
  }

  return value;
}

export default createAngularJsAdapter<[ITimeoutService]>({
  component: Field,
  require: '?ngModel',
  scope: {
    uicontrol: {
      angularJsBind: '@',
    },
    name: {
      angularJsBind: '@',
    },
    value: {
      vue: 'modelValue',
      angularJsBind: '@',
      transform(value, vm, scope) {
        // vue components expect object data as input, so we parse JSON data
        // for angularjs directives that use JSON.
        return handleJsonValue(value, scope.varType, scope.uicontrol);
      },
    },
    default: {
      vue: 'defaultValue',
      angularJsBind: '@',
    },
    options: {
      angularJsBind: '=',
    },
    description: {
      angularJsBind: '@',
    },
    introduction: {
      angularJsBind: '@',
    },
    title: {
      angularJsBind: '@',
    },
    inlineHelp: {
      angularJsBind: '@',
    },
    disabled: {
      angularJsBind: '=',
      transform: transformAngularJsBoolAttr,
    },
    uiControlAttributes: {
      angularJsBind: '=',
    },
    uiControlOptions: {
      angularJsBind: '=',
    },
    autocomplete: {
      angularJsBind: '@',
      transform: transformAngularJsBoolAttr,
    },
    condition: {
      angularJsBind: '@',
      transform(value, vm, scope) {
        let transformed = value;
        if (value) {
          transformed = (values: unknown[]) => scope.$eval(value, values);
        }
        return transformed;
      },
    },
    varType: {
      angularJsBind: '@',
    },
    autofocus: {
      angularJsBind: '@',
      transform: transformAngularJsBoolAttr,
    },
    tabindex: {
      angularJsBind: '@',
      transform: transformAngularJsIntAttr,
    },
    fullWidth: {
      angularJsBind: '@',
      transform: transformAngularJsBoolAttr,
    },
    maxlength: {
      angularJsBind: '@',
      transform: transformAngularJsIntAttr,
    },
    required: {
      angularJsBind: '@',
      transform: transformAngularJsBoolAttr,
    },
    placeholder: {
      angularJsBind: '@',
    },
    rows: {
      angularJsBind: '@',
      transform: transformAngularJsIntAttr,
    },
    min: {
      angularJsBind: '@',
      transform: transformAngularJsIntAttr,
    },
    max: {
      angularJsBind: '@',
      transform: transformAngularJsIntAttr,
    },
    component: {
      angularJsBind: '<',
      transform(value, vm, scope) {
        if (!value) {
          return value;
        }

        if (scope.templateFile) {
          return shallowRef(FieldAngularJsTemplate);
        }

        const { plugin, name } = value;
        if (!plugin || !name) {
          throw new Error("Invalid component property given to piwik-field directive, must be {plugin: '...',name: '...'}");
        }

        return shallowRef(useExternalPluginComponent(plugin, name));
      },
    },
  },
  directiveName: 'piwikField',
  $inject: ['$timeout'],
  events: {
    'update:modelValue': (newValue, vm, scope, element, attrs, ngModel, $timeout) => {
      if (newValue !== scope.value) {
        $timeout(() => {
          if (!ngModel) {
            scope.value = newValue;
          }

          // ngModel being used
          (ngModel as INgModelController).$setViewValue(scope.value);
        });
      }
    },
  },
  postCreate(vm, scope, element, attrs, controller) {
    const ngModel = controller as INgModelController;

    if (!ngModel) {
      scope.$watch('value', (newVal) => {
        if (newVal !== vm.modelValue) {
          const transformed = handleJsonValue(newVal, scope.varType, scope.uicontrol);

          nextTick(() => {
            vm.modelValue = transformed;
          });
        }
      });
    }

    // ngModel being used
    if (typeof scope.value !== 'undefined') {
      const transformed = handleJsonValue(scope.value, scope.varType, scope.uicontrol);
      (ngModel as INgModelController).$setViewValue(transformed);
    }

    ngModel.$render = () => {
      nextTick(() => {
        vm.modelValue = processScopeProperty(ngModel.$viewValue);
      });
    };

    ngModel.$setViewValue(vm.modelValue);
  },
});
