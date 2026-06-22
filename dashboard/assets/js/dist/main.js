"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // assets/js/src/core/events.ts
  var subscribers = /* @__PURE__ */ new Map();
  function ensureSet(event) {
    let set2 = subscribers.get(event);
    if (!set2) {
      set2 = /* @__PURE__ */ new Set();
      subscribers.set(event, set2);
    }
    return set2;
  }
  function on(event, handler) {
    const set2 = ensureSet(event);
    set2.add(handler);
    return () => {
      set2.delete(handler);
    };
  }
  function emit(event, payload) {
    const set2 = subscribers.get(event);
    if (!set2) {
      return;
    }
    for (const handler of set2) {
      try {
        handler(payload);
      } catch (e) {
        console.warn(`[events] ${event} handler error:`, e);
      }
    }
  }

  // assets/js/src/core/storage.ts
  var subscribers2 = /* @__PURE__ */ new Set();
  var nativeListenerInstalled = false;
  function installNativeListener() {
    if (nativeListenerInstalled) {
      return;
    }
    nativeListenerInstalled = true;
    window.addEventListener("storage", (ev) => {
      if (ev.key === null) {
        return;
      }
      for (const handler of subscribers2) {
        try {
          handler(ev.key, ev.newValue);
        } catch (e) {
          console.warn("[storage] handler error:", e);
        }
      }
      if (ev.key.startsWith("rgSlot") || ev.key === "lcRegimen_v1") {
        emit("regimen:changed", { slotId: ev.key, reason: "restore" });
      }
    });
  }
  function set(key, value) {
    let serialized;
    try {
      serialized = JSON.stringify(value);
    } catch {
      return { ok: false, key, reason: "serialize-error" };
    }
    try {
      localStorage.setItem(key, serialized);
    } catch {
      return { ok: false, key, reason: "quota-exceeded" };
    }
    if (localStorage.getItem(key) !== serialized) {
      return { ok: false, key, reason: "verify-mismatch" };
    }
    return { ok: true, key };
  }
  function getValidated(key, schema) {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  }
  function onChange(handler) {
    installNativeListener();
    subscribers2.add(handler);
    return () => {
      subscribers2.delete(handler);
    };
  }

  // node_modules/zod/v3/external.js
  var external_exports = {};
  __export(external_exports, {
    BRAND: () => BRAND,
    DIRTY: () => DIRTY,
    EMPTY_PATH: () => EMPTY_PATH,
    INVALID: () => INVALID,
    NEVER: () => NEVER,
    OK: () => OK,
    ParseStatus: () => ParseStatus,
    Schema: () => ZodType,
    ZodAny: () => ZodAny,
    ZodArray: () => ZodArray,
    ZodBigInt: () => ZodBigInt,
    ZodBoolean: () => ZodBoolean,
    ZodBranded: () => ZodBranded,
    ZodCatch: () => ZodCatch,
    ZodDate: () => ZodDate,
    ZodDefault: () => ZodDefault,
    ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
    ZodEffects: () => ZodEffects,
    ZodEnum: () => ZodEnum,
    ZodError: () => ZodError,
    ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
    ZodFunction: () => ZodFunction,
    ZodIntersection: () => ZodIntersection,
    ZodIssueCode: () => ZodIssueCode,
    ZodLazy: () => ZodLazy,
    ZodLiteral: () => ZodLiteral,
    ZodMap: () => ZodMap,
    ZodNaN: () => ZodNaN,
    ZodNativeEnum: () => ZodNativeEnum,
    ZodNever: () => ZodNever,
    ZodNull: () => ZodNull,
    ZodNullable: () => ZodNullable,
    ZodNumber: () => ZodNumber,
    ZodObject: () => ZodObject,
    ZodOptional: () => ZodOptional,
    ZodParsedType: () => ZodParsedType,
    ZodPipeline: () => ZodPipeline,
    ZodPromise: () => ZodPromise,
    ZodReadonly: () => ZodReadonly,
    ZodRecord: () => ZodRecord,
    ZodSchema: () => ZodType,
    ZodSet: () => ZodSet,
    ZodString: () => ZodString,
    ZodSymbol: () => ZodSymbol,
    ZodTransformer: () => ZodEffects,
    ZodTuple: () => ZodTuple,
    ZodType: () => ZodType,
    ZodUndefined: () => ZodUndefined,
    ZodUnion: () => ZodUnion,
    ZodUnknown: () => ZodUnknown,
    ZodVoid: () => ZodVoid,
    addIssueToContext: () => addIssueToContext,
    any: () => anyType,
    array: () => arrayType,
    bigint: () => bigIntType,
    boolean: () => booleanType,
    coerce: () => coerce,
    custom: () => custom,
    date: () => dateType,
    datetimeRegex: () => datetimeRegex,
    defaultErrorMap: () => en_default,
    discriminatedUnion: () => discriminatedUnionType,
    effect: () => effectsType,
    enum: () => enumType,
    function: () => functionType,
    getErrorMap: () => getErrorMap,
    getParsedType: () => getParsedType,
    instanceof: () => instanceOfType,
    intersection: () => intersectionType,
    isAborted: () => isAborted,
    isAsync: () => isAsync,
    isDirty: () => isDirty,
    isValid: () => isValid,
    late: () => late,
    lazy: () => lazyType,
    literal: () => literalType,
    makeIssue: () => makeIssue,
    map: () => mapType,
    nan: () => nanType,
    nativeEnum: () => nativeEnumType,
    never: () => neverType,
    null: () => nullType,
    nullable: () => nullableType,
    number: () => numberType,
    object: () => objectType,
    objectUtil: () => objectUtil,
    oboolean: () => oboolean,
    onumber: () => onumber,
    optional: () => optionalType,
    ostring: () => ostring,
    pipeline: () => pipelineType,
    preprocess: () => preprocessType,
    promise: () => promiseType,
    quotelessJson: () => quotelessJson,
    record: () => recordType,
    set: () => setType,
    setErrorMap: () => setErrorMap,
    strictObject: () => strictObjectType,
    string: () => stringType,
    symbol: () => symbolType,
    transformer: () => effectsType,
    tuple: () => tupleType,
    undefined: () => undefinedType,
    union: () => unionType,
    unknown: () => unknownType,
    util: () => util,
    void: () => voidType
  });

  // node_modules/zod/v3/helpers/util.js
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  var ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  var getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };

  // node_modules/zod/v3/ZodError.js
  var ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  var quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
  };
  var ZodError = class _ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof _ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };

  // node_modules/zod/v3/locales/en.js
  var errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  var en_default = errorMap;

  // node_modules/zod/v3/errors.js
  var overrideErrorMap = en_default;
  function setErrorMap(map) {
    overrideErrorMap = map;
  }
  function getErrorMap() {
    return overrideErrorMap;
  }

  // node_modules/zod/v3/helpers/parseUtil.js
  var makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  var EMPTY_PATH = [];
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === en_default ? void 0 : en_default
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  var ParseStatus = class _ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return _ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  };
  var INVALID = Object.freeze({
    status: "aborted"
  });
  var DIRTY = (value) => ({ status: "dirty", value });
  var OK = (value) => ({ status: "valid", value });
  var isAborted = (x) => x.status === "aborted";
  var isDirty = (x) => x.status === "dirty";
  var isValid = (x) => x.status === "valid";
  var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

  // node_modules/zod/v3/helpers/errorUtil.js
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));

  // node_modules/zod/v3/types.js
  var ParseInputLazyPath = class {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  };
  var handleResult = (ctx, result) => {
    if (isValid(result)) {
      return { success: true, data: result.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message ?? ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: message ?? required_error ?? ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  var ZodType = class {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      const ctx = {
        common: {
          issues: [],
          async: params?.async ?? false,
          contextualErrorMap: params?.errorMap
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
    }
    "~validate"(data) {
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result) ? {
            value: result.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if (err?.message?.toLowerCase()?.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
        value: result.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params?.errorMap,
          async: true
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  };
  var cuidRegex = /^c[^\s-]{8,}$/i;
  var cuid2Regex = /^[0-9a-z]+$/;
  var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  var nanoidRegex = /^[a-z0-9_-]{21}$/i;
  var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  var emojiRegex;
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  var dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && decoded?.typ !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  var ZodString = class _ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  var ZodNumber = class _ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodBigInt = class _ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  var ZodBoolean = class extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodDate = class _ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new _ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  var ZodSymbol = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  var ZodUndefined = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  var ZodNull = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  var ZodAny = class extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  var ZodUnknown = class extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  var ZodNever = class extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  var ZodVoid = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  var ZodArray = class _ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result2) => {
          return ParseStatus.mergeArray(status, result2);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new _ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new _ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new _ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  var ZodObject = class _ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {
        } else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new _ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new _ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new _ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  var ZodUnion = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  var getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
      return [type.value];
    } else if (type instanceof ZodEnum) {
      return type.options;
    } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
    } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
      return [void 0];
    } else if (type instanceof ZodNull) {
      return [null];
    } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
    } else {
      return [];
    }
  };
  var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new _ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  var ZodIntersection = class extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  var ZodTuple = class _ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new _ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  var ZodRecord = class _ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new _ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new _ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  var ZodMap = class extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  var ZodSet = class _ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new _ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new _ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  var ZodFunction = class _ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new _ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new _ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new _ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  var ZodLazy = class extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  var ZodLiteral = class extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  var ZodEnum = class _ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return _ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  var ZodNativeEnum = class extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  var ZodPromise = class extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  var ZodEffects = class extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  var ZodOptional = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  var ZodNullable = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  var ZodDefault = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  var ZodCatch = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result2) => {
          return {
            status: "valid",
            value: result2.status === "valid" ? result2.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  var ZodNaN = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  var BRAND = Symbol("zod_brand");
  var ZodBranded = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  var ZodPipeline = class _ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new _ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  var ZodReadonly = class extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
  }
  function custom(check, _params = {}, fatal) {
    if (check)
      return ZodAny.create().superRefine((data, ctx) => {
        const r = check(data);
        if (r instanceof Promise) {
          return r.then((r2) => {
            if (!r2) {
              const params = cleanParams(_params, data);
              const _fatal = params.fatal ?? fatal ?? true;
              ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
          });
        }
        if (!r) {
          const params = cleanParams(_params, data);
          const _fatal = params.fatal ?? fatal ?? true;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
        return;
      });
    return ZodAny.create();
  }
  var late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  var instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
  }) => custom((data) => data instanceof cls, params);
  var stringType = ZodString.create;
  var numberType = ZodNumber.create;
  var nanType = ZodNaN.create;
  var bigIntType = ZodBigInt.create;
  var booleanType = ZodBoolean.create;
  var dateType = ZodDate.create;
  var symbolType = ZodSymbol.create;
  var undefinedType = ZodUndefined.create;
  var nullType = ZodNull.create;
  var anyType = ZodAny.create;
  var unknownType = ZodUnknown.create;
  var neverType = ZodNever.create;
  var voidType = ZodVoid.create;
  var arrayType = ZodArray.create;
  var objectType = ZodObject.create;
  var strictObjectType = ZodObject.strictCreate;
  var unionType = ZodUnion.create;
  var discriminatedUnionType = ZodDiscriminatedUnion.create;
  var intersectionType = ZodIntersection.create;
  var tupleType = ZodTuple.create;
  var recordType = ZodRecord.create;
  var mapType = ZodMap.create;
  var setType = ZodSet.create;
  var functionType = ZodFunction.create;
  var lazyType = ZodLazy.create;
  var literalType = ZodLiteral.create;
  var enumType = ZodEnum.create;
  var nativeEnumType = ZodNativeEnum.create;
  var promiseType = ZodPromise.create;
  var effectsType = ZodEffects.create;
  var optionalType = ZodOptional.create;
  var nullableType = ZodNullable.create;
  var preprocessType = ZodEffects.createWithPreprocess;
  var pipelineType = ZodPipeline.create;
  var ostring = () => stringType().optional();
  var onumber = () => numberType().optional();
  var oboolean = () => booleanType().optional();
  var coerce = {
    string: (arg) => ZodString.create({ ...arg, coerce: true }),
    number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
    boolean: (arg) => ZodBoolean.create({
      ...arg,
      coerce: true
    }),
    bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
    date: (arg) => ZodDate.create({ ...arg, coerce: true })
  };
  var NEVER = INVALID;

  // assets/js/src/core/schemas/coverage-layout.ts
  var LayoutTileSchema = external_exports.object({
    /**
     * Canonical essential name — the join key into the CoverageSnapshot
     * (state/coverage.ts). Equals the `name` field in essentials-targets-data.json.
     * Display fields below (name/sym/letter/abbr) are abbreviated chrome; `key` is
     * the stable identity used to look up live status.
     */
    key: external_exports.string().min(1),
    /** Atomic number (minerals). */
    num: external_exports.number().optional(),
    /** Chemical symbol (minerals). */
    sym: external_exports.string().optional(),
    /** Vitamin letter code (e.g. "B12"). */
    letter: external_exports.string().optional(),
    /** Amino three-letter abbreviation (e.g. "Arg"). */
    abbr: external_exports.string().optional(),
    /** Section sequence code (e.g. "V·01", "AA·03", "F·02"). */
    code: external_exports.string().optional(),
    /** Display name (abbreviated, uppercase). */
    name: external_exports.string().min(1),
    /** Optional sub-hint line (fatty acids). */
    hint: external_exports.string().optional()
  });
  var LayoutSubsectionSchema = external_exports.object({
    rank: external_exports.string(),
    label: external_exports.string(),
    hint: external_exports.string(),
    tiles: external_exports.array(LayoutTileSchema)
  });
  var LayoutSectionSchema = external_exports.object({
    num: external_exports.string(),
    title: external_exports.string(),
    sub: external_exports.string(),
    gridClass: external_exports.string(),
    tileClass: external_exports.enum(["tile", "tile--vitamin", "tile--amino", "tile--fat"]),
    subsections: external_exports.array(LayoutSubsectionSchema).optional(),
    tiles: external_exports.array(LayoutTileSchema).optional()
  });
  var LayoutGoalSchema = external_exports.object({
    id: external_exports.string(),
    name: external_exports.string(),
    total: external_exports.number()
  });
  var CoverageLayoutSchema = external_exports.object({
    sections: external_exports.array(LayoutSectionSchema),
    goals: external_exports.array(LayoutGoalSchema)
  });

  // assets/js/src/core/schemas/coverage-status.ts
  var CoverageTargetSchema = external_exports.object({
    /** trace_pdm · hbsp · dietary · wallach · wallach_clinical · dietary_with_clinical_lever · unspecified · … */
    kind: external_exports.string().optional(),
    /** Lower bound of the Wallach target in `unit`. */
    low: external_exports.number().optional(),
    high: external_exports.number().optional(),
    unit: external_exports.string().optional()
  }).passthrough();
  var RegimenNutrientSchema = external_exports.object({
    name: external_exports.string(),
    amount: external_exports.coerce.number(),
    unit: external_exports.string().optional()
  }).passthrough();
  var RegimenVaultEntrySchema = external_exports.object({
    canonical_name: external_exports.string().optional(),
    name: external_exports.string().optional(),
    nutrients: external_exports.array(external_exports.unknown()).optional()
  }).passthrough();

  // assets/js/src/core/schemas/knowledge.ts
  var EssentialSchema = external_exports.object({
    name: external_exports.string(),
    category: external_exports.string(),
    target: external_exports.unknown().optional(),
    wallach_stance: external_exports.object({
      stance: external_exports.string().optional(),
      citation: external_exports.string().optional()
    }).optional()
  }).passthrough();
  var EssentialsDataSchema = external_exports.object({
    essentials: external_exports.array(EssentialSchema)
  }).passthrough();
  var ProductEntrySchema = external_exports.object({
    name: external_exports.string().optional(),
    brand: external_exports.string().optional(),
    nutrients: external_exports.array(external_exports.unknown()).optional()
  }).passthrough();
  var ProductsLookupSchema = external_exports.record(external_exports.string(), external_exports.unknown());

  // assets/js/src/core/schemas/log.ts
  var LogKindSchema = external_exports.enum([
    "session-start",
    "session-end",
    "round-close",
    "build",
    "invariant-pass",
    "invariant-fail",
    "incident",
    "milestone",
    "design-decision",
    "note"
  ]);
  var LogEntrySchema = external_exports.object({
    /** Unique id — typically a ULID-ish string. */
    id: external_exports.string().min(1),
    /** ISO-8601 timestamp the event was recorded. */
    ts: external_exports.string().min(1),
    /** Surface or module the event came from ("coverage", "scanner", "tools", "main", etc). */
    surface: external_exports.string().min(1),
    /** Kind tag (drives the chip color in the profile panel). */
    kind: LogKindSchema,
    /** Short headline — twitter-length. */
    summary: external_exports.string().min(1).max(280),
    /** Optional longer body. */
    detail: external_exports.string().optional(),
    /** Optional structured payload (cite paths, file lists, scores, etc). */
    metadata: external_exports.record(external_exports.unknown()).optional()
  });
  var LogShapeSchema = external_exports.object({
    entries: external_exports.array(LogEntrySchema).default([])
  });

  // assets/js/src/core/schemas/regimen.ts
  var RegimenLabelSchema = external_exports.object({
    name: external_exports.string(),
    brand: external_exports.string().optional(),
    nutrients: external_exports.array(external_exports.unknown()).optional()
  }).passthrough();
  var RegimenItemSchema = external_exports.object({
    id: external_exports.number(),
    label: RegimenLabelSchema,
    addedDate: external_exports.string(),
    // ISO YYYY-MM-DD
    provenance: external_exports.string()
    // 'user_scanned' | 'user_manual' | 'wishlist_promoted' | ...
  });
  var RegimenSchema = external_exports.object({
    items: external_exports.array(RegimenItemSchema)
  });
  var OverridesMapSchema = external_exports.record(external_exports.string(), external_exports.record(external_exports.string(), external_exports.unknown()));
  var RgManualSchema = external_exports.array(RegimenItemSchema);
  var RgRemovedSchema = external_exports.array(external_exports.number());
  var RgUserGoalsSchema = external_exports.array(external_exports.string());

  // assets/js/src/core/schemas/scanner.ts
  var VerdictSchema = external_exports.enum(["ADD", "SAVE", "REJECT"]);
  var ScanLabelSchema = external_exports.object({
    name: external_exports.string(),
    brand: external_exports.string().optional(),
    servings: external_exports.union([external_exports.string(), external_exports.number()]).optional(),
    nutrients: external_exports.array(external_exports.object({
      name: external_exports.string(),
      amount: external_exports.number().optional(),
      unit: external_exports.string().optional()
    })).optional(),
    ingredients: external_exports.string().optional()
  });
  var GapFillSchema = external_exports.object({
    essential: external_exports.string(),
    gapFillPct: external_exports.number(),
    amountClaimed: external_exports.number().optional(),
    unit: external_exports.string().optional()
  });
  var AlignmentSchema = external_exports.object({
    score: external_exports.number(),
    aligned: external_exports.number(),
    total: external_exports.number(),
    misaligned: external_exports.number()
  });
  var HistoryEntrySchema = external_exports.object({
    id: external_exports.number(),
    ts: external_exports.string(),
    // ISO timestamp
    label: ScanLabelSchema,
    verdict: VerdictSchema,
    alignment: AlignmentSchema,
    goals: external_exports.array(external_exports.string()),
    gapFills: external_exports.array(GapFillSchema)
  });
  var HistoryShapeSchema = external_exports.object({
    items: external_exports.array(HistoryEntrySchema)
  });

  // assets/data/regimen-base-data.json
  var regimen_base_data_default = {
    _purpose: "Default HBSP foundation stack (Wallach Healthy Body Start Pak 2.5: BTT 2.5 + Beyond Osteo FX + Ultimate EFA Plus). Migrated VERBATIM from legacy-dashboard.js REGIMEN_BASE_DATA.recommended (YGY label data). Merged as the base layer of the effective regimen so a fresh dashboard demos real coverage; user-removable via rgRemoved (negative ids).",
    _source: "legacy-dashboard.js REGIMEN_BASE_DATA.recommended",
    items: [
      {
        id: -1,
        label: {
          name: "BTT 2.5 Canister",
          dose_text: "2 scoops (15g) daily",
          nutrients: [
            {
              name: "Vitamin A (beta-carotene)",
              amount: 810,
              unit: "mcg RAE",
              form: "retinyl palmitate (46%) + beta-carotene (54%)",
              alignment: "aligned"
            },
            {
              name: "Vitamin C",
              amount: 1e3,
              unit: "mg",
              form: "ascorbic acid",
              alignment: "aligned"
            },
            {
              name: "Vitamin D3",
              amount: 18.8,
              unit: "mcg",
              form: "cholecalciferol",
              alignment: "aligned"
            },
            {
              name: "Vitamin E",
              amount: 100,
              unit: "mg",
              form: "d-alpha tocopheryl acetate",
              alignment: "partial"
            },
            {
              name: "Vitamin B1 (Thiamine)",
              amount: 30,
              unit: "mg",
              form: "thiamine mononitrate",
              alignment: "aligned"
            },
            {
              name: "Vitamin B2 (Riboflavin)",
              amount: 30,
              unit: "mg",
              form: "riboflavin",
              alignment: "aligned"
            },
            {
              name: "Vitamin B3 (Niacin)",
              amount: 40,
              unit: "mg NE",
              form: "niacinamide",
              alignment: "aligned"
            },
            {
              name: "Vitamin B6 (Pyridoxine)",
              amount: 30,
              unit: "mg",
              form: "pyridoxine HCl",
              alignment: "partial"
            },
            {
              name: "Folic Acid (Folate)",
              amount: 400,
              unit: "mcg DFE",
              form: "calcium-L-5-methylfolate",
              alignment: "aligned"
            },
            {
              name: "Vitamin B12 (Cobalamin)",
              amount: 500,
              unit: "mcg",
              form: "methylcobalamin",
              alignment: "aligned"
            },
            {
              name: "Biotin",
              amount: 600,
              unit: "mcg",
              form: "biotin",
              alignment: "aligned"
            },
            {
              name: "Vitamin B5 (Pantothenic Acid)",
              amount: 150,
              unit: "mg",
              form: "D-calcium pantothenate",
              alignment: "aligned"
            },
            {
              name: "Choline",
              amount: 25,
              unit: "mg",
              form: "choline bitartrate",
              alignment: "partial"
            },
            {
              name: "Calcium",
              amount: 130,
              unit: "mg",
              form: "Ca gluconate/ascorbate/citrate",
              alignment: "partial"
            },
            {
              name: "Iron",
              amount: 1,
              unit: "mg",
              form: "ferrous gluconate",
              alignment: "partial"
            },
            {
              name: "Magnesium",
              amount: 20,
              unit: "mg",
              form: "Mg gluconate and oxide",
              alignment: "partial"
            },
            {
              name: "Zinc",
              amount: 2,
              unit: "mg",
              form: "zinc gluconate",
              alignment: "partial"
            },
            {
              name: "Selenium",
              amount: 100,
              unit: "mcg",
              form: "selenomethionine",
              alignment: "aligned"
            },
            {
              name: "Copper",
              amount: 1,
              unit: "mg",
              form: "copper gluconate",
              alignment: "partial"
            },
            {
              name: "Chromium",
              amount: 200,
              unit: "mcg",
              form: "chromium chelate",
              alignment: "partial"
            },
            {
              name: "Potassium",
              amount: 100,
              unit: "mg",
              form: "K gluconate and citrate",
              alignment: "aligned"
            },
            {
              name: "Boron",
              amount: 1,
              unit: "mg",
              form: "boron citrate",
              alignment: "aligned"
            },
            {
              name: "Vitamin K (Menaquinone = K2)",
              amount: 30,
              unit: "mcg",
              form: "menaquinone-7 (K2 MK-7)",
              alignment: "aligned"
            }
          ]
        },
        addedDate: "2026-06-21",
        provenance: "wallach_hbsp_default"
      },
      {
        id: -2,
        label: {
          name: "Beyond Osteo FX Powder",
          dose_text: "1 scoop (12.8 g) daily",
          nutrients: [
            {
              name: "Vitamin D3",
              amount: 25,
              unit: "mcg",
              form: "cholecalciferol",
              alignment: "aligned"
            },
            {
              name: "Calcium",
              amount: 1200,
              unit: "mg",
              form: "unspecified",
              alignment: "aligned"
            },
            {
              name: "Phosphorus",
              amount: 600,
              unit: "mg",
              form: "unspecified",
              alignment: "aligned"
            },
            {
              name: "Magnesium",
              amount: 300,
              unit: "mg",
              form: "unspecified",
              alignment: "aligned"
            },
            {
              name: "Zinc",
              amount: 5,
              unit: "mg",
              form: "unspecified",
              alignment: "partial"
            },
            {
              name: "Copper",
              amount: 0.1,
              unit: "mg",
              form: "unspecified",
              alignment: "partial"
            },
            {
              name: "Sulfur",
              amount: 250,
              unit: "mg",
              form: "MSM",
              alignment: "aligned"
            },
            {
              name: "Strontium",
              amount: 500,
              unit: "mg",
              form: "unspecified",
              alignment: "aligned"
            },
            {
              name: "Boron",
              amount: 1,
              unit: "mg",
              form: "unspecified",
              alignment: "aligned"
            }
          ]
        },
        addedDate: "2026-06-21",
        provenance: "wallach_hbsp_default"
      },
      {
        id: -3,
        label: {
          name: "Ultimate EFA Plus",
          dose_text: "1 softgel daily",
          nutrients: [
            {
              name: "Omega-3 (alpha-linolenic + EPA/DHA in marine form)",
              amount: 585,
              unit: "mg",
              form: "ALA 300 + EPA 171 + DHA 114 (per softgel)",
              alignment: "aligned"
            },
            {
              name: "Omega-6 (linoleic + GLA)",
              amount: 122,
              unit: "mg",
              form: "Linoleic 103 + GLA 19 (per softgel)",
              alignment: "aligned"
            },
            {
              name: "Omega-9 (Arachidonic / Oleic)",
              amount: 120,
              unit: "mg",
              form: "Oleic",
              alignment: "aligned"
            }
          ]
        },
        addedDate: "2026-06-21",
        provenance: "wallach_hbsp_default"
      }
    ]
  };

  // assets/js/src/state/regimen.ts
  var REGIMEN_KEY = "lcRegimen_v1";
  var RG_OVERRIDES_KEY = "rgOverrides_v1";
  var RG_MANUAL_KEY = "rgManualItems_v1";
  var RG_REMOVED_KEY = "rgRemoved_v1";
  var RG_USER_GOALS_KEY = "rgUserGoals_v1";
  function fireLegacyTrigger(label) {
    const w = window;
    if (typeof w.triggerRegimenRerender === "function") {
      try {
        w.triggerRegimenRerender(label);
      } catch (e) {
        console.warn("[state/regimen] legacy triggerRegimenRerender threw:", e);
      }
    }
  }
  function loadRegimen() {
    return getValidated(REGIMEN_KEY, RegimenSchema) ?? { items: [] };
  }
  function loadRgOverrides() {
    return getValidated(RG_OVERRIDES_KEY, OverridesMapSchema) ?? {};
  }
  function loadRgManual() {
    return getValidated(RG_MANUAL_KEY, RgManualSchema) ?? [];
  }
  function loadRgRemoved() {
    const arr = getValidated(RG_REMOVED_KEY, RgRemovedSchema);
    return new Set(arr ?? []);
  }
  function loadRgUserGoals() {
    return getValidated(RG_USER_GOALS_KEY, RgUserGoalsSchema);
  }
  var cachedBase = null;
  function loadBaseRegimen() {
    if (cachedBase === null) {
      const parsed = RegimenSchema.safeParse(regimen_base_data_default);
      cachedBase = parsed.success ? parsed.data.items : [];
    }
    return cachedBase;
  }
  function loadEffectiveRegimen() {
    const removed = loadRgRemoved();
    const byId = /* @__PURE__ */ new Map();
    for (const item of [...loadBaseRegimen(), ...loadRegimen().items, ...loadRgManual()]) {
      if (removed.has(item.id)) {
        continue;
      }
      byId.set(item.id, item);
    }
    return [...byId.values()];
  }
  function saveRgOverride(id, patch) {
    const all = loadRgOverrides();
    const key = String(id);
    all[key] = { ...all[key] ?? {}, ...patch };
    set(RG_OVERRIDES_KEY, all);
    fireLegacyTrigger(`saveRgOverride:${id}`);
    emit("regimen:changed", { slotId: RG_OVERRIDES_KEY, reason: "dose-edit" });
  }
  function saveRgManual(items) {
    set(RG_MANUAL_KEY, items);
    fireLegacyTrigger("saveRgManual");
    emit("regimen:changed", { slotId: RG_MANUAL_KEY, reason: "add" });
  }
  function saveRgRemoved(setOfIds) {
    set(RG_REMOVED_KEY, [...setOfIds]);
    fireLegacyTrigger("saveRgRemoved");
    emit("regimen:changed", { slotId: RG_REMOVED_KEY, reason: "remove" });
  }

  // assets/js/src/state/coverage.ts
  function catFromTarget(raw) {
    switch (raw) {
      case "vitamins":
        return "vitamins";
      case "amino_acids":
        return "aminos";
      case "fatty_acids":
        return "fatty-acids";
      default:
        return "other";
    }
  }
  function buildTileId(name) {
    return `tile_${name.toLowerCase().replace(/\W+/g, "_")}`;
  }
  function readTargets() {
    const el = typeof document === "undefined" ? null : document.getElementById("essentials-targets-data");
    if (el === null) {
      return [];
    }
    let parsed;
    try {
      parsed = JSON.parse(el.textContent ?? "{}");
    } catch {
      return [];
    }
    const result = EssentialsDataSchema.safeParse(parsed);
    return result.success ? result.data.essentials : [];
  }
  function cleanName(s) {
    return s.toLowerCase().replace(/\s*\([^)]*\)\s*/g, "").trim();
  }
  function toMg(value, unit) {
    const u = (unit ?? "mg").toLowerCase();
    if (u === "g") {
      return { v: value * 1e3, u: "mg" };
    }
    if (u === "mcg" || u === "\u03BCg" || u === "\xB5g") {
      return { v: value / 1e3, u: "mg" };
    }
    if (u === "iu") {
      return { v: value, u: "iu" };
    }
    return { v: value, u: "mg" };
  }
  function buildByName(targets) {
    const m = /* @__PURE__ */ new Map();
    for (const t of targets) {
      m.set(cleanName(t.name), t);
    }
    return m;
  }
  function matchToEssential(nutrientName, targets, byName) {
    if (nutrientName === "") {
      return null;
    }
    const nn = cleanName(nutrientName);
    const direct = byName.get(nn);
    if (direct !== void 0) {
      return direct;
    }
    for (const t of targets) {
      const tn = cleanName(t.name);
      if (tn === nn) {
        return t;
      }
      if (nn.startsWith("vitamin ") && tn.startsWith("vitamin ")) {
        const nv = nn.replace("vitamin ", "").split(/[\s(+]/)[0] ?? "";
        const tv = tn.replace("vitamin ", "").split(/[\s(+]/)[0] ?? "";
        if (nv !== "" && nv === tv) {
          return t;
        }
        const nvBase = nv.replace(/\d+$/, "");
        const tvBase = tv.replace(/\d+$/, "");
        if (nvBase !== "" && nvBase === tvBase && nv === nvBase !== (tv === tvBase)) {
          return t;
        }
        if (nv !== nvBase && tv !== tvBase) {
          const esc = nv.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          if (new RegExp(`\\b${esc}\\b`).test(tn)) {
            return t;
          }
        }
      }
      if (nn.includes("omega") && tn.includes("omega")) {
        const nm = (nn.match(/omega[-\s]?(\d)/) ?? [])[1];
        const tm = (tn.match(/omega[-\s]?(\d)/) ?? [])[1];
        if (nm !== void 0 && tm !== void 0 && nm === tm) {
          return t;
        }
      }
      if ((nn.includes("folate") || nn.includes("folic")) && tn.includes("folic")) {
        return t;
      }
    }
    return null;
  }
  var EMPTY_DELIVERY = { totalMg: 0, totalIU: 0, sources: [] };
  function readScale(item, overrides) {
    const ov = overrides[String(item.id)];
    const candidates = [
      ov?.["scaling_factor"],
      item["scaling_factor"],
      item.label["servings"]
    ];
    for (const c of candidates) {
      const n = typeof c === "number" ? c : typeof c === "string" ? Number.parseFloat(c) : Number.NaN;
      if (Number.isFinite(n) && n > 0) {
        return n;
      }
    }
    return 1;
  }
  function accumulate(items, overrides, targets, byName) {
    const out = /* @__PURE__ */ new Map();
    for (const t of targets) {
      out.set(t.name, { totalMg: 0, totalIU: 0, sources: [] });
    }
    for (const item of items) {
      const scale = readScale(item, overrides);
      const displayName = typeof item.label.name === "string" && item.label.name !== "" ? item.label.name : "Unknown";
      const rawNutrients = Array.isArray(item.label.nutrients) ? item.label.nutrients : [];
      for (const raw of rawNutrients) {
        const parsed = RegimenNutrientSchema.safeParse(raw);
        if (!parsed.success) {
          continue;
        }
        const n = parsed.data;
        if (!(n.amount > 0)) {
          continue;
        }
        const matched = matchToEssential(n.name, targets, byName);
        if (matched === null) {
          continue;
        }
        const d = out.get(matched.name);
        if (d === void 0) {
          continue;
        }
        const conv = toMg(n.amount * scale, n.unit);
        if (conv.u === "iu") {
          d.totalIU += conv.v;
        } else {
          d.totalMg += conv.v;
        }
        if (!d.sources.includes(displayName)) {
          d.sources.push(displayName);
        }
      }
    }
    return out;
  }
  var PDM_TRACE = /\bbtt\b|tangerine|plant.derived|humic|colloidal|utt/;
  var PDM_COLLECTIVE = /\bbtt\b|tangerine|utt|amino/;
  function numericStatus(target, d) {
    const isIU = (target.unit ?? "").toLowerCase() === "iu";
    const current = isIU ? d.totalIU : d.totalMg;
    const lowRaw = target.low ?? 0;
    const low = isIU ? lowRaw : toMg(lowRaw, target.unit).v;
    if (low <= 0) {
      return current > 0 ? "covered" : "";
    }
    if (current >= low * 0.95) {
      return "covered";
    }
    if (current >= low * 0.3) {
      return "partial";
    }
    return "gap";
  }
  function classify(target, d) {
    const hasSrc = d.sources.length > 0;
    const kind = target?.kind;
    if (target === null || kind === void 0 || kind === "unspecified") {
      return hasSrc ? "covered" : "";
    }
    if (kind === "dietary") {
      return hasSrc ? "covered" : "";
    }
    if (kind === "trace_pdm" || kind === "wallach_collective") {
      const stack = d.sources.join(" | ").toLowerCase();
      const re = kind === "trace_pdm" ? PDM_TRACE : PDM_COLLECTIVE;
      return re.test(stack) ? "trace" : "";
    }
    if (kind === "dietary_with_clinical_lever") {
      if (target.low !== void 0 && target.low > 0) {
        return numericStatus(target, d);
      }
      return hasSrc ? "covered" : "";
    }
    return numericStatus(target, d);
  }
  function deliveryRatio(target, status, d) {
    if (target === null) {
      return status === "covered" || status === "trace" ? 1 : 0;
    }
    const isIU = (target.unit ?? "").toLowerCase() === "iu";
    const current = isIU ? d.totalIU : d.totalMg;
    const lowRaw = target.low ?? 0;
    const low = isIU ? lowRaw : toMg(lowRaw, target.unit).v;
    if (low > 0) {
      return current / low;
    }
    return status === "covered" || status === "trace" ? 1 : 0;
  }
  var cachedSnapshot = null;
  function recompute() {
    const targets = readTargets();
    const byName = buildByName(targets);
    const overrides = loadRgOverrides();
    const delivery = accumulate(loadEffectiveRegimen(), overrides, targets, byName);
    const tiles = targets.map((entry) => {
      const target = CoverageTargetSchema.safeParse(entry.target);
      const t = target.success ? target.data : null;
      const d = delivery.get(entry.name) ?? EMPTY_DELIVERY;
      const status = classify(t, d);
      return {
        tileId: buildTileId(entry.name),
        category: catFromTarget(entry.category),
        symbol: "",
        name: entry.name,
        status,
        covered: status === "covered" || status === "trace",
        fillPercent: deliveryRatio(t, status, d),
        coveredBy: d.sources,
        aggregateVehicle: status === "trace"
      };
    });
    const byCategory = {};
    for (const tile of tiles) {
      const bucket = byCategory[tile.category] ?? { total: 0, covered: 0 };
      bucket.total += 1;
      if (tile.covered) {
        bucket.covered += 1;
      }
      byCategory[tile.category] = bucket;
    }
    const coveredCount = tiles.filter((t) => t.covered).length;
    cachedSnapshot = {
      tiles,
      coveredCount,
      totalCount: tiles.length,
      computedAt: (/* @__PURE__ */ new Date()).toISOString(),
      byCategory
    };
    emit("coverage:recomputed", { coveredCount, totalCount: tiles.length });
    return cachedSnapshot;
  }
  function getOrCompute() {
    return cachedSnapshot ?? recompute();
  }
  var wireInstalled = false;
  function installRecomputeTrigger() {
    if (wireInstalled) {
      return;
    }
    wireInstalled = true;
    on("regimen:changed", () => recompute());
    onChange((key) => {
      if (key.startsWith("rgSlot") || key === "lcRegimen_v1") {
        recompute();
      }
    });
    const w = window;
    const original = w.triggerRegimenRerender;
    if (typeof original === "function") {
      w.triggerRegimenRerender = () => {
        try {
          original();
        } finally {
          recompute();
        }
      };
    }
  }

  // assets/js/src/state/scanner.ts
  var RECENT_SCANS_KEY = "lcRecentScans_v1";
  function getHistory() {
    return getValidated(RECENT_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
  }

  // assets/data/coverage-layout-data.json
  var coverage_layout_data_default = {
    sections: [
      {
        num: "01",
        title: "MINERALS",
        sub: "// 60 \xB7 THE FOUNDATION \xB7 ATOMIC SYMBOLS PRESERVED",
        gridClass: "essentials-grid--minerals",
        tileClass: "tile",
        subsections: [
          {
            rank: "A",
            label: "FOUNDATIONAL",
            hint: "structural + macro \xB7 atomic order",
            tiles: [
              { key: "Hydrogen", num: 1, sym: "H", name: "HYDROGEN" },
              { key: "Carbon", num: 6, sym: "C", name: "CARBON" },
              { key: "Nitrogen", num: 7, sym: "N", name: "NITROGEN" },
              { key: "Oxygen", num: 8, sym: "O", name: "OXYGEN" },
              { key: "Sodium", num: 11, sym: "Na", name: "SODIUM" },
              { key: "Magnesium", num: 12, sym: "Mg", name: "MAGNES." },
              { key: "Phosphorus", num: 15, sym: "P", name: "PHOS." },
              { key: "Sulfur", num: 16, sym: "S", name: "SULFUR" },
              { key: "Chloride", num: 17, sym: "Cl", name: "CHLORIDE" },
              { key: "Potassium", num: 19, sym: "K", name: "POTAS." },
              { key: "Calcium", num: 20, sym: "Ca", name: "CALCIUM" }
            ]
          },
          {
            rank: "B",
            label: "MAJOR TRACE",
            hint: "mid-dose essentials \xB7 A\u2192Z",
            tiles: [
              { key: "Boron", num: 5, sym: "B", name: "BORON" },
              { key: "Cobalt", num: 27, sym: "Co", name: "COBALT" },
              { key: "Chromium", num: 24, sym: "Cr", name: "CHROM." },
              { key: "Copper", num: 29, sym: "Cu", name: "COPPER" },
              { key: "Fluoride", num: 9, sym: "F", name: "FLUORINE" },
              { key: "Iron", num: 26, sym: "Fe", name: "IRON" },
              { key: "Iodine", num: 53, sym: "I", name: "IODINE" },
              { key: "Manganese", num: 25, sym: "Mn", name: "MANGAN." },
              { key: "Molybdenum", num: 42, sym: "Mo", name: "MOLYB." },
              { key: "Selenium", num: 34, sym: "Se", name: "SELEN." },
              { key: "Silica", num: 14, sym: "Si", name: "SILICON" },
              { key: "Strontium", num: 38, sym: "Sr", name: "STRONT." },
              { key: "Vanadium", num: 23, sym: "V", name: "VANAD." },
              { key: "Zinc", num: 30, sym: "Zn", name: "ZINC" }
            ]
          },
          {
            rank: "C",
            label: "RARE TRACE",
            hint: "PDM aggregate spectrum \xB7 A\u2192Z",
            tiles: [
              { key: "Silver", num: 47, sym: "Ag", name: "SILVER" },
              { key: "Aluminum", num: 13, sym: "Al", name: "ALUMIN." },
              { key: "Arsenic", num: 33, sym: "As", name: "ARSENIC" },
              { key: "Gold", num: 79, sym: "Au", name: "GOLD" },
              { key: "Barium", num: 56, sym: "Ba", name: "BARIUM" },
              { key: "Beryllium", num: 4, sym: "Be", name: "BERYL" },
              { key: "Bromine", num: 35, sym: "Br", name: "BROMINE" },
              { key: "Cerium", num: 58, sym: "Ce", name: "CERIUM" },
              { key: "Cesium", num: 55, sym: "Cs", name: "CESIUM" },
              { key: "Dysprosium", num: 66, sym: "Dy", name: "DYSPRO." },
              { key: "Erbium", num: 68, sym: "Er", name: "ERBIUM" },
              { key: "Europium", num: 63, sym: "Eu", name: "EUROP." },
              { key: "Gallium", num: 31, sym: "Ga", name: "GALL." },
              { key: "Gadolinium", num: 64, sym: "Gd", name: "GADOL." },
              { key: "Hafnium", num: 72, sym: "Hf", name: "HAFNIUM" },
              { key: "Holmium", num: 67, sym: "Ho", name: "HOLMIUM" },
              { key: "Lanthanum", num: 57, sym: "La", name: "LANTH." },
              { key: "Lithium", num: 3, sym: "Li", name: "LITHIUM" },
              { key: "Lutetium", num: 71, sym: "Lu", name: "LUTET." },
              { key: "Niobium", num: 41, sym: "Nb", name: "NIOB." },
              { key: "Neodymium", num: 60, sym: "Nd", name: "NEOD." },
              { key: "Nickel", num: 28, sym: "Ni", name: "NICKEL" },
              { key: "Praseodymium", num: 59, sym: "Pr", name: "PRASEO." },
              { key: "Rubidium", num: 37, sym: "Rb", name: "RUBID." },
              { key: "Rhenium", num: 75, sym: "Re", name: "RHENIUM" },
              { key: "Scandium", num: 21, sym: "Sc", name: "SCAND." },
              { key: "Samarium", num: 62, sym: "Sm", name: "SAMAR." },
              { key: "Tin", num: 50, sym: "Sn", name: "TIN" },
              { key: "Tantalum", num: 73, sym: "Ta", name: "TANTAL." },
              { key: "Terbium", num: 65, sym: "Tb", name: "TERBIUM" },
              { key: "Titanium", num: 22, sym: "Ti", name: "TITAN." },
              { key: "Thulium", num: 69, sym: "Tm", name: "THULIUM" },
              { key: "Yttrium", num: 39, sym: "Y", name: "YTTRIUM" },
              { key: "Ytterbium", num: 70, sym: "Yb", name: "YTTERB." },
              { key: "Zirconium", num: 40, sym: "Zr", name: "ZIRCON." }
            ]
          }
        ]
      },
      {
        num: "02",
        title: "VITAMINS",
        sub: "// 16 \xB7 THE CO-FACTORS \xB7 ENZYME ENABLERS",
        gridClass: "essentials-grid--vitamins",
        tileClass: "tile--vitamin",
        tiles: [
          { key: "Vitamin A (Retinol / beta-carotene)", code: "V\xB701", letter: "A", name: "RETINOL" },
          { key: "Vitamin B1 (Thiamine)", code: "V\xB702", letter: "B1", name: "THIAMINE" },
          { key: "Vitamin B2 (Riboflavin)", code: "V\xB703", letter: "B2", name: "RIBOFLAVIN" },
          { key: "Vitamin B3 (Niacin)", code: "V\xB704", letter: "B3", name: "NIACIN" },
          { key: "Vitamin B5 (Pantothenic Acid)", code: "V\xB705", letter: "B5", name: "PANTO." },
          { key: "Vitamin B6 (Pyridoxine)", code: "V\xB706", letter: "B6", name: "PYRIDOX." },
          { key: "Folic Acid (Folate)", code: "V\xB707", letter: "B9", name: "FOLATE" },
          { key: "Vitamin B12 (Cobalamin)", code: "V\xB708", letter: "B12", name: "COBALAMIN" },
          { key: "Vitamin C (Ascorbic Acid)", code: "V\xB709", letter: "C", name: "ASCORBIC" },
          { key: "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)", code: "V\xB710", letter: "D3", name: "CHOLECAL." },
          { key: "Vitamin E (Tocopherol)", code: "V\xB711", letter: "E", name: "TOCOPH." },
          { key: "Vitamin K (Menaquinone = K2)", code: "V\xB712", letter: "K", name: "MENAQ." },
          { key: "Biotin", code: "V\xB713", letter: "H", name: "BIOTIN" },
          { key: "Choline", code: "V\xB714", letter: "Ch", name: "CHOLINE" },
          { key: "Inositol", code: "V\xB715", letter: "In", name: "INOSITOL" },
          { key: "Flavonoids / Bioflavonoids", code: "V\xB716", letter: "Fl", name: "FLAVON." }
        ]
      },
      {
        num: "03",
        title: "AMINO ACIDS",
        sub: "// 12 \xB7 PROTEIN BUILDING BLOCKS \xB7 ESSENTIAL + CONDITIONAL",
        gridClass: "essentials-grid--aminos",
        tileClass: "tile--amino",
        tiles: [
          { key: "Arginine", code: "AA\xB701", abbr: "Arg", name: "ARGININE" },
          { key: "Cysteine", code: "AA\xB702", abbr: "Cys", name: "CYSTEINE" },
          { key: "Histidine", code: "AA\xB703", abbr: "His", name: "HISTIDINE" },
          { key: "Isoleucine", code: "AA\xB704", abbr: "Ile", name: "ISOLEUCINE" },
          { key: "Leucine", code: "AA\xB705", abbr: "Leu", name: "LEUCINE" },
          { key: "Lysine", code: "AA\xB706", abbr: "Lys", name: "LYSINE" },
          { key: "Methionine", code: "AA\xB707", abbr: "Met", name: "METHIONINE" },
          { key: "Phenylalanine", code: "AA\xB708", abbr: "Phe", name: "PHENYLAL." },
          { key: "Threonine", code: "AA\xB709", abbr: "Thr", name: "THREONINE" },
          { key: "Tryptophan", code: "AA\xB710", abbr: "Trp", name: "TRYPTOPH." },
          { key: "Tyrosine", code: "AA\xB711", abbr: "Tyr", name: "TYROSINE" },
          { key: "Valine", code: "AA\xB712", abbr: "Val", name: "VALINE" }
        ]
      },
      {
        num: "04",
        title: "FATTY ACIDS",
        sub: "// 3 \xB7 ESSENTIAL LIPIDS \xB7 MEMBRANE + SIGNAL",
        gridClass: "essentials-grid--fats",
        tileClass: "tile--fat",
        tiles: [
          { key: "Omega-3 (alpha-linolenic + EPA/DHA in marine form)", code: "F\xB701", name: "OMEGA-3", hint: "n-3 \xB7 ALA \xB7 EPA \xB7 DHA" },
          { key: "Omega-6 (linoleic + GLA)", code: "F\xB702", name: "OMEGA-6", hint: "n-6 \xB7 linoleic \xB7 GLA" },
          { key: "Omega-9 (Arachidonic / Oleic)", code: "F\xB703", name: "OMEGA-9", hint: "n-9 \xB7 oleic \xB7 arachidonic" }
        ]
      }
    ],
    goals: [
      { id: "bone-skeletal", name: "BONE & SKELETAL", total: 14 },
      { id: "energy-metabolism", name: "ENERGY & METABOLISM", total: 13 },
      { id: "cognition", name: "COGNITION", total: 11 },
      { id: "hormones-strength", name: "HORMONES & STRENGTH", total: 12 },
      { id: "longevity-anti-aging", name: "LONGEVITY & ANTI-AGING", total: 18 },
      { id: "cardiovascular", name: "CARDIOVASCULAR", total: 10 }
    ]
  };

  // assets/js/src/views/coverage.ts
  var LAYOUT = CoverageLayoutSchema.parse(coverage_layout_data_default);
  function tileStatusFor(key, snapshot) {
    if (snapshot === null) {
      return "";
    }
    return snapshot.tiles.find((t) => t.name === key)?.status ?? "";
  }
  function escHTML(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function renderTile(spec, tileClass, snapshot) {
    const status = tileStatusFor(spec.key, snapshot);
    const cls = `${tileClass} ${status}`.trim();
    let inner = "";
    if (spec.num !== void 0) {
      inner += `<span class="tile__num">${spec.num}</span>`;
    }
    if (spec.sym !== void 0) {
      inner += `<span class="tile__sym">${escHTML(spec.sym)}</span>`;
    }
    if (spec.letter !== void 0) {
      inner += `<span class="tile__letter">${escHTML(spec.letter)}</span>`;
    }
    if (spec.abbr !== void 0) {
      inner += `<span class="tile__abbr">${escHTML(spec.abbr)}</span>`;
    }
    if (spec.code !== void 0) {
      inner += `<span class="tile__code">${escHTML(spec.code)}</span>`;
    }
    inner += `<span class="tile__name">${escHTML(spec.name)}</span>`;
    if (spec.hint !== void 0) {
      inner += `<span class="tile__hint">${escHTML(spec.hint)}</span>`;
    }
    return `<div class="${cls}">${inner}</div>`;
  }
  function renderSection(spec, snapshot) {
    let bodyHTML = "";
    let allTiles = [];
    if (spec.subsections !== void 0) {
      bodyHTML = spec.subsections.map((sub) => `
      <div class="essentials-subsection">
        <div class="essentials-subsection__label">
          <span class="essentials-subsection__rank">${escHTML(sub.rank)}</span>
          ${escHTML(sub.label)}
          <span class="essentials-subsection__count">\xB7 ${sub.tiles.length}</span>
          <span class="essentials-subsection__hint">${escHTML(sub.hint)}</span>
        </div>
        <div class="${spec.gridClass}">
          ${sub.tiles.map((t) => renderTile(t, spec.tileClass, snapshot)).join("")}
        </div>
      </div>
    `).join("");
      allTiles = spec.subsections.flatMap((s) => s.tiles);
    } else if (spec.tiles !== void 0) {
      bodyHTML = `<div class="${spec.gridClass}">${spec.tiles.map((t) => renderTile(t, spec.tileClass, snapshot)).join("")}</div>`;
      allTiles = spec.tiles;
    }
    const total = allTiles.length;
    const covered = allTiles.filter((t) => {
      const s = tileStatusFor(t.key, snapshot);
      return s === "covered" || s === "trace";
    }).length;
    return `
    <section class="essentials-section">
      <header class="essentials-section__head">
        <div class="essentials-section__num">${escHTML(spec.num)}</div>
        <h3 class="essentials-section__title">${escHTML(spec.title)}</h3>
        <div class="essentials-section__sub">${escHTML(spec.sub)}</div>
        <div class="essentials-section__stat"><strong>${covered}</strong> / ${total} covered</div>
      </header>
      <div class="essentials-section__divider"></div>
      ${bodyHTML}
    </section>
  `;
  }
  function renderHero(snapshot) {
    const total = snapshot?.totalCount ?? 92;
    const covered = snapshot?.coveredCount ?? 0;
    const sections = LAYOUT.sections.map((s) => renderSection(s, snapshot)).join("");
    return `
    <section class="coverage-hero ds-border-travel">
      <header class="coverage-hero__head">
        <div>
          <div class="coverage-hero__kicker">Your essentials \xB7 <span class="ds-cipher" data-cipher-set="numfrac">92</span> minerals + vitamins + amino acids + fats</div>
          <h2 class="coverage-hero__title">
            THE WHOLE PICTURE
            <em>// what you'''re absorbing, what you'''re missing</em>
          </h2>
        </div>
        <div class="coverage-stat">
          <span class="coverage-stat__num">${covered}</span>
          <span class="coverage-stat__den">/ ${total}</span>
          <span class="coverage-stat__label">essentials<br>covered</span>
        </div>
      </header>
      <div class="essentials-host">
        <span class="ds-scan-line" aria-hidden="true"></span>
        ${sections}
      </div>
      <div class="legend">
        <span class="legend__item"><span class="legend__sw covered"></span> COVERED</span>
        <span class="legend__item"><span class="legend__sw partial"></span> PARTIAL</span>
        <span class="legend__item"><span class="legend__sw trace"></span> TRACE \xB7 VIA AGGREGATE VEHICLE</span>
        <span class="legend__item"><span class="legend__sw gap"></span> GAP \xB7 ATTENTION</span>
      </div>
    </section>
  `;
  }
  function renderGoalsStrip(snapshot) {
    const userGoals = loadRgUserGoals() ?? [];
    const activeGoals = userGoals.length > 0 ? LAYOUT.goals.filter((g) => userGoals.includes(g.id)) : LAYOUT.goals.slice(0, 3);
    const cardsHTML = activeGoals.map((g, i) => {
      const num = String(i + 1).padStart(2, "0");
      const covered = snapshot !== null ? Math.min(g.total, Math.round(snapshot.coveredCount / snapshot.totalCount * g.total)) : 0;
      const pct = Math.round(covered / g.total * 100);
      return `
      <div class="goal-card">
        <div class="goal-card__kicker">GOAL \xB7 ${num}</div>
        <div class="goal-card__name">${escHTML(g.name)}</div>
        <div class="goal-card__bar"><div class="goal-card__bar-fill" style="width: ${pct}%"></div></div>
        <div class="goal-card__progress">${pct}% \xB7 ${covered} / ${g.total} essentials covered</div>
      </div>
    `;
    }).join("");
    return `
    <section class="goals-strip">
      <header class="goals-strip__head">
        <h3 class="goals-strip__title">YOUR GOALS</h3>
        <span class="goals-strip__count">${activeGoals.length} ACTIVE \xB7 ${LAYOUT.goals.length} AVAILABLE</span>
        <button class="goals-strip__add">+ ADD GOAL</button>
      </header>
      <div class="goals-row">${cardsHTML}</div>
    </section>
  `;
  }
  function renderRail() {
    const items = loadEffectiveRegimen().slice(0, 8);
    const itemsHTML = items.map((item) => {
      const labelName = (item.label.name || "?").toString();
      const icon = labelName.charAt(0).toUpperCase();
      return `
      <div class="regimen-item">
        <div class="regimen-item__icon">${escHTML(icon)}</div>
        <div class="regimen-item__body">
          <p class="regimen-item__name">${escHTML(labelName)}</p>
          <span class="regimen-item__meta">DAILY</span>
        </div>
        <span class="regimen-item__count">${item.label.nutrients?.length ?? 0}</span>
      </div>
    `;
    }).join("") || '<div class="regimen-item"><div class="regimen-item__body"><p class="regimen-item__name">\u2014 no items \u2014</p></div></div>';
    return `
    <aside class="regimen-rail">
      <header class="regimen-rail__head">
        <div class="regimen-rail__eyebrow"><span class="pulse-dot"></span>CURRENT SLOT \xB7 <span class="ds-cipher" data-cipher-set="hexa">02\xB7F71D</span></div>
        <h3 class="regimen-rail__slot-name">DAILY PROTOCOL</h3>
        <div class="regimen-rail__slot-meta">
          <span><strong>${items.length}</strong> items</span>
          <span>\xB7</span>
          <span>Slot <strong>2 of 5</strong></span>
          <span>\xB7</span>
          <span>Synced</span>
        </div>
      </header>
      <div class="regimen-rail__list">${itemsHTML}</div>
      <div class="regimen-rail__actions">
        <button class="ds-btn-ghost" style="flex: 1;">MANAGE</button>
        <button class="ds-btn-primary" style="flex: 1;">ADD ITEM</button>
      </div>
    </aside>
  `;
  }
  var CIPHER_SETS = {
    hexa: "0123456789ABCDEF",
    alphanum: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numfrac: "0123456789",
    time: "0123456789:\xB7DHMS"
  };
  var cipherInterval = null;
  var cipherTickCount = 0;
  function startCipherEngine(container) {
    if (cipherInterval !== null) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    cipherInterval = window.setInterval(() => {
      cipherTickCount += 1;
      const elements = Array.from(container.querySelectorAll(".ds-cipher"));
      for (const el of elements) {
        let original = el.dataset["cipherOriginal"];
        if (original === void 0) {
          original = el.textContent ?? "";
          el.dataset["cipherOriginal"] = original;
          const setKey = el.dataset["cipherSet"] ?? "alphanum";
          el.dataset["cipherSetResolved"] = CIPHER_SETS[setKey] ?? CIPHER_SETS["alphanum"] ?? "";
        }
        const set2 = el.dataset["cipherSetResolved"] ?? "";
        if (cipherTickCount % 5 === 0) {
          el.textContent = original;
          continue;
        }
        if (original.length === 0 || set2.length === 0) {
          continue;
        }
        const chars = original.split("");
        const i = Math.floor(Math.random() * chars.length);
        const charAt = chars[i];
        if (charAt === void 0) {
          continue;
        }
        if (!/[A-Z0-9·:]/i.test(charAt)) {
          continue;
        }
        const newChar = set2[Math.floor(Math.random() * set2.length)] ?? charAt;
        chars[i] = newChar;
        el.textContent = chars.join("");
      }
    }, 1e3);
  }
  function stopCipherEngine() {
    if (cipherInterval !== null) {
      window.clearInterval(cipherInterval);
      cipherInterval = null;
    }
  }
  function mount(container) {
    const render = () => {
      const snapshot = getOrCompute();
      container.innerHTML = `
      <div class="coverage-grid">
        <div class="coverage-main">
          ${renderHero(snapshot)}
          ${renderGoalsStrip(snapshot)}
        </div>
        ${renderRail()}
      </div>
    `;
    };
    render();
    startCipherEngine(container);
    const unsubCoverage = on("coverage:recomputed", () => render());
    const unsubRegimen = on("regimen:changed", () => render());
    return {
      update: render,
      unmount: () => {
        unsubCoverage();
        unsubRegimen();
        stopCipherEngine();
        container.innerHTML = "";
      }
    };
  }

  // assets/js/src/state/log.ts
  var CREATORS_LOG_KEY = "wallachCreatorsLog_v1";
  function getEntries() {
    const shape = getValidated(CREATORS_LOG_KEY, LogShapeSchema);
    const entries = shape?.entries ?? [];
    return [...entries].sort((a, b) => a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0);
  }
  function getEntriesByKind(kind) {
    return getEntries().filter((e) => e.kind === kind);
  }

  // assets/js/src/views/profile.ts
  function escHTML2(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function formatTs(iso) {
    if (iso.length < 16) {
      return iso;
    }
    return `${iso.slice(0, 10)} ${iso.slice(11, 16)}`;
  }
  function kindLabel(k) {
    const map = {
      "session-start": "SESSION START",
      "session-end": "SESSION END",
      "round-close": "ROUND CLOSE",
      "build": "BUILD",
      "invariant-pass": "INVARIANT \u2713",
      "invariant-fail": "INVARIANT \u2717",
      "incident": "INCIDENT",
      "milestone": "MILESTONE",
      "design-decision": "DESIGN",
      "note": "NOTE"
    };
    return map[k];
  }
  function kindClass(k) {
    const map = {
      "session-start": "pf-pill pf-pill--neutral",
      "session-end": "pf-pill pf-pill--neutral",
      "round-close": "pf-pill pf-pill--ok",
      "build": "pf-pill pf-pill--neutral",
      "invariant-pass": "pf-pill pf-pill--ok",
      "invariant-fail": "pf-pill pf-pill--err",
      "incident": "pf-pill pf-pill--err",
      "milestone": "pf-pill pf-pill--accent",
      "design-decision": "pf-pill pf-pill--accent",
      "note": "pf-pill pf-pill--neutral"
    };
    return map[k];
  }
  function renderLogEntry(entry) {
    const detailHTML = entry.detail !== void 0 && entry.detail.length > 0 ? `<div class="pf-log-entry__detail">${escHTML2(entry.detail)}</div>` : "";
    return `
    <article class="pf-log-entry" data-log-id="${escHTML2(entry.id)}">
      <header class="pf-log-entry__head">
        <span class="pf-log-entry__ts">${escHTML2(formatTs(entry.ts))}</span>
        <span class="pf-log-entry__surface">${escHTML2(entry.surface)}</span>
        <span class="${kindClass(entry.kind)}">${escHTML2(kindLabel(entry.kind))}</span>
      </header>
      <h4 class="pf-log-entry__summary">${escHTML2(entry.summary)}</h4>
      ${detailHTML}
    </article>
  `;
  }
  function renderLogEmpty() {
    return `
    <div class="pf-empty">
      <div class="pf-empty__mark">\u25CB</div>
      <h3 class="pf-empty__title">No log entries yet</h3>
      <p class="pf-empty__body">
        Round closes, invariant results, incidents, and milestones will appear here
        once <code>state/log.log()</code> is called from the \xA700 audit trail hooks.
      </p>
    </div>
  `;
  }
  function renderLogTab() {
    const entries = getEntries();
    if (entries.length === 0) {
      return renderLogEmpty();
    }
    return `<div class="pf-log-stream">${entries.map(renderLogEntry).join("")}</div>`;
  }
  function renderInvariantsTab() {
    const passes = getEntriesByKind("invariant-pass");
    const fails = getEntriesByKind("invariant-fail");
    const total = passes.length + fails.length;
    if (total === 0) {
      return `
      <div class="pf-empty">
        <div class="pf-empty__mark">\u25CB</div>
        <h3 class="pf-empty__title">No invariant runs recorded</h3>
        <p class="pf-empty__body">
          Run <code>python3 tools/invariants.py</code> and let the hook log to
          state/log to populate this scoreboard.
        </p>
      </div>
    `;
    }
    const passPct = total > 0 ? Math.round(passes.length / total * 100) : 0;
    return `
    <div class="pf-inv-board">
      <div class="pf-inv-stat pf-inv-stat--ok">
        <div class="pf-inv-stat__num">${passes.length}</div>
        <div class="pf-inv-stat__label">passes</div>
      </div>
      <div class="pf-inv-stat pf-inv-stat--err">
        <div class="pf-inv-stat__num">${fails.length}</div>
        <div class="pf-inv-stat__label">failures</div>
      </div>
      <div class="pf-inv-stat">
        <div class="pf-inv-stat__num">${passPct}%</div>
        <div class="pf-inv-stat__label">pass rate</div>
      </div>
    </div>
  `;
  }
  function renderBuildTab() {
    const lastBuild = getEntriesByKind("build")[0] ?? null;
    if (lastBuild === null) {
      return `
      <div class="pf-empty">
        <div class="pf-empty__mark">\u25CB</div>
        <h3 class="pf-empty__title">No build events recorded</h3>
        <p class="pf-empty__body">
          Build events appear here when <code>tools/build-dashboard.sh</code>
          logs a round.
        </p>
      </div>
    `;
    }
    return `
    <div class="pf-build-card">
      <div class="pf-build-card__ts">${escHTML2(formatTs(lastBuild.ts))}</div>
      <h3 class="pf-build-card__summary">${escHTML2(lastBuild.summary)}</h3>
      ${lastBuild.detail !== void 0 ? `<pre class="pf-build-card__detail">${escHTML2(lastBuild.detail)}</pre>` : ""}
    </div>
  `;
  }
  function renderTabBody(tab) {
    if (tab === "log") {
      return renderLogTab();
    }
    if (tab === "invariants") {
      return renderInvariantsTab();
    }
    return renderBuildTab();
  }
  function renderShell(tab, totalEntries) {
    return `
    <div class="pf-panel" role="dialog" aria-label="Profile">
      <header class="pf-panel__head">
        <div class="pf-panel__title-block">
          <div class="pf-panel__eyebrow">
            <span class="pulse-dot"></span>PROFILE \xB7 <span class="ds-cipher" data-cipher-set="hexa">PF\xB70001</span>
          </div>
          <h2 class="pf-panel__title">Luneth <em>// creator</em></h2>
          <div class="pf-panel__sub">${totalEntries} entr${totalEntries === 1 ? "y" : "ies"} on file \xB7 Wallach discipline audit</div>
        </div>
        <button class="pf-panel__close" data-pf-action="close" aria-label="Close profile">\u2715</button>
      </header>
      <nav class="pf-tabs">
        <button class="pf-tab ${tab === "log" ? "pf-tab--active" : ""}" data-pf-tab="log">Creator's Log</button>
        <button class="pf-tab ${tab === "invariants" ? "pf-tab--active" : ""}" data-pf-tab="invariants">Invariants</button>
        <button class="pf-tab ${tab === "build" ? "pf-tab--active" : ""}" data-pf-tab="build">Build</button>
      </nav>
      <div class="pf-body">${renderTabBody(tab)}</div>
    </div>
  `;
  }
  var CIPHER_SETS2 = {
    hexa: "0123456789ABCDEF",
    alphanum: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  };
  var cipherInterval2 = null;
  var cipherTick = 0;
  function startCipherEngine2(container) {
    if (cipherInterval2 !== null) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    cipherInterval2 = window.setInterval(() => {
      cipherTick += 1;
      const elements = Array.from(container.querySelectorAll(".ds-cipher"));
      for (const el of elements) {
        let original = el.dataset["cipherOriginal"];
        if (original === void 0) {
          original = el.textContent ?? "";
          el.dataset["cipherOriginal"] = original;
          const setKey = el.dataset["cipherSet"] ?? "alphanum";
          el.dataset["cipherSetResolved"] = CIPHER_SETS2[setKey] ?? CIPHER_SETS2["alphanum"] ?? "";
        }
        const set2 = el.dataset["cipherSetResolved"] ?? "";
        if (cipherTick % 5 === 0) {
          el.textContent = original;
          continue;
        }
        if (original.length === 0 || set2.length === 0) {
          continue;
        }
        const chars = original.split("");
        const i = Math.floor(Math.random() * chars.length);
        const charAt = chars[i];
        if (charAt === void 0) {
          continue;
        }
        if (!/[A-Z0-9·:]/i.test(charAt)) {
          continue;
        }
        const newChar = set2[Math.floor(Math.random() * set2.length)] ?? charAt;
        chars[i] = newChar;
        el.textContent = chars.join("");
      }
    }, 1e3);
  }
  function stopCipherEngine2() {
    if (cipherInterval2 !== null) {
      window.clearInterval(cipherInterval2);
      cipherInterval2 = null;
    }
  }
  function mount2(container) {
    let tab = "log";
    const render = () => {
      container.innerHTML = renderShell(tab, getEntries().length);
    };
    const onClick = (ev) => {
      const target = ev.target;
      if (target === null) {
        return;
      }
      const tabBtn = target.closest("[data-pf-tab]");
      if (tabBtn !== null) {
        const t = tabBtn.dataset["pfTab"];
        if (t !== void 0) {
          tab = t;
          render();
        }
        return;
      }
      const actionBtn = target.closest("[data-pf-action]");
      if (actionBtn !== null && actionBtn.dataset["pfAction"] === "close") {
        container.dispatchEvent(new CustomEvent("pf:close", { bubbles: true }));
      }
    };
    render();
    startCipherEngine2(container);
    container.addEventListener("click", onClick);
    const unsubLog = on("log:entry-added", () => render());
    return {
      update: render,
      unmount: () => {
        unsubLog();
        stopCipherEngine2();
        container.removeEventListener("click", onClick);
        container.innerHTML = "";
      }
    };
  }

  // assets/js/src/views/regimen.ts
  var SLOT_PLACEHOLDERS = [
    { id: "slot-01", num: "01", serial: "01\xB7A23F", name: "Travel Pack", items: 6, coverage: 31, total: 92, stamp: "SAVED \xB7 2D AGO" },
    { id: "slot-02", num: "02", serial: "02\xB7F71D", name: "Daily Protocol", items: 9, coverage: 47, total: 92, stamp: "EDIT 0:14 AGO", active: true },
    { id: "slot-03", num: "03", serial: "03\xB7C8B2", name: "Sleep Stack", items: 4, coverage: 18, total: 92, stamp: "SAVED \xB7 1W AGO" },
    { id: "slot-04", num: "04", serial: "04\xB7E901", name: "Recovery Ramp", items: 11, coverage: 54, total: 92, stamp: "SAVED \xB7 3W AGO" },
    { id: "slot-05", num: "05", serial: "", name: "", items: 0, coverage: 0, total: 92, stamp: "", empty: true }
  ];
  var RECOMMENDATIONS = [
    { name: "CHEWABLE VITAMIN D3", contribution: 12, heat: "xl", reason: "Closes 12 trace tiles via the PDM-aggregate vehicle. Single-serve daily, neutral taste." },
    { name: "ULTIMATE EFA PLUS", contribution: 2, heat: "md", reason: "Adds Omega-6 + Omega-9 coverage. Bone & skeletal goal already at 78%, this raises to 84%." },
    { name: "CHEWABLE C\xB71000", contribution: 1, heat: "sm", reason: "Strengthens existing Vitamin C coverage to clinical-dose level per Wallach Rare Earths p. 132." },
    { name: "SLENDER FX SHAKE", contribution: 8, heat: "lg", reason: "Meal-replacement option; adds 8 essentials at once but high overlap with existing BTT." }
  ];
  var WISHLIST = [
    { name: "HYDRA DNA COLLAGEN", contribution: 0, heat: "sm", reason: "Logged 2026-06-15 \xB7 skin & connective tissue goal \xB7 pending cost/timing decision." },
    { name: "OPTIVIDA HEMP EXTRACT", contribution: 0, heat: "sm", reason: "Deferred \u2014 overlap with sleep stack already; revisit once sleep goal closes." }
  ];
  function escHTML3(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function contributionPips(contribution) {
    return Math.max(0, Math.min(10, Math.ceil(contribution / 3)));
  }
  function renderPips(filled) {
    let html = "";
    for (let i = 0; i < 10; i += 1) {
      const cls = i < filled ? "contrib-pip fill" : "contrib-pip";
      html += `<span class="${cls}"></span>`;
    }
    return html;
  }
  function itemIcon(item) {
    const name = (item.label.name ?? "?").toString();
    return name.charAt(0).toUpperCase();
  }
  function itemContribution(item) {
    return item.label.nutrients?.length ?? 0;
  }
  function renderSlot(slot) {
    if (slot.empty === true) {
      return `
      <article class="slot-card empty" data-slot-id="${escHTML3(slot.id)}">
        <div class="slot-card__empty-mark">+</div>
        <div class="slot-card__empty-label">EMPTY SLOT</div>
      </article>
    `;
    }
    const activeClass = slot.active === true ? " active ds-border-travel" : "";
    const scanLine = slot.active === true ? '<span class="ds-scan-line" aria-hidden="true"></span>' : "";
    const serialPrefix = slot.active === true ? "\u25CF " : "";
    const serialSuffix = slot.active === true ? " \xB7 ACTIVE" : "";
    return `
    <article class="slot-card${activeClass}" data-slot-id="${escHTML3(slot.id)}" data-slot-num="${escHTML3(slot.num)}">
      ${scanLine}
      <div class="slot-card__serial">${serialPrefix}<span class="ds-cipher" data-cipher-set="hexa">${escHTML3(slot.serial)}</span>${serialSuffix}</div>
      <div class="slot-card__num">${escHTML3(slot.num)}</div>
      <h3 class="slot-card__name">${escHTML3(slot.name)}</h3>
      <div class="slot-card__items">${slot.items} items \xB7 <span class="slot-card__coverage">${slot.coverage}</span>/${slot.total}</div>
      <div class="slot-card__stamp">${escHTML3(slot.stamp)}</div>
    </article>
  `;
  }
  function renderSlotsShowcase() {
    const slotsHTML = SLOT_PLACEHOLDERS.map(renderSlot).join("");
    return `
    <section class="slots-showcase">
      <header class="slots-showcase__head">
        <div>
          <div class="slots-showcase__kicker">YOUR CARTRIDGES \xB7 ${SLOT_PLACEHOLDERS.length} SLOTS \xB7 <span class="ds-cipher" data-cipher-set="hexa">02\xB7F71D</span> ACTIVE</div>
          <h2 class="slots-showcase__title">
            CARTRIDGES
            <em>// each slot is a standalone protocol \u2014 save, switch, share</em>
          </h2>
        </div>
        <button class="slots-showcase__new" data-rg-action="new-cartridge">+ NEW CARTRIDGE</button>
      </header>
      <div class="slots-grid">${slotsHTML}</div>
    </section>
  `;
  }
  function readDose(raw) {
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw) : Number.NaN;
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  function renderItemRow(item, overrides) {
    const contrib = itemContribution(item);
    const pips = renderPips(contributionPips(contrib));
    const icon = itemIcon(item);
    const name = (item.label.name ?? "(unnamed)").toString();
    const ov = overrides[String(item.id)] ?? {};
    const amount = readDose(ov["dose_amount"]);
    const freq = readDose(ov["dose_freq"]);
    const scaling = amount * freq;
    return `
    <div class="regimen-item-row" data-item-id="${item.id}">
      <div class="regimen-item-row__icon">${escHTML3(icon)}</div>
      <div class="regimen-item-row__body">
        <h4 class="regimen-item-row__name">${escHTML3(name)}</h4>
        <div class="regimen-item-row__contrib">
          <span class="regimen-item-row__contrib-label">CONTRIBUTES \xB7 ${contrib}</span>
          ${pips}
        </div>
      </div>
      <div class="dose-block">
        <input class="dose-input" type="text" value="${amount}" data-rg-dose="amount" data-item-id="${item.id}" />
        <span class="dose-unit dose-unit--label">DOSE</span>
        <span class="dose-sep">\xD7</span>
        <input class="dose-input" type="text" value="${freq}" data-rg-dose="freq" data-item-id="${item.id}" />
        <span class="dose-unit dose-unit--label">PER DAY</span>
      </div>
      <span class="scaling">\xD7${scaling.toFixed(1)}</span>
      <button class="btn-remove" title="Remove" data-rg-action="remove" data-item-id="${item.id}">\xD7</button>
    </div>
  `;
  }
  function renderActiveSlot(items, coverageCount, overrides) {
    const rowsHTML = items.length > 0 ? items.map((item) => renderItemRow(item, overrides)).join("") : '<div class="regimen-item-row regimen-item-row--empty"><div class="regimen-item-row__body"><h4 class="regimen-item-row__name">\u2014 no items yet \u2014</h4></div></div>';
    return `
    <section class="active-slot">
      <header class="active-slot__head">
        <div class="active-slot__eyebrow"><span class="pulse-dot"></span>EDITING \xB7 SLOT <span class="ds-cipher" data-cipher-set="hexa">02\xB7F71D</span></div>
        <div class="active-slot__title-row">
          <div>
            <h2 class="active-slot__title">Daily Protocol</h2>
            <div class="active-slot__meta">
              <span><strong>${items.length}</strong> items</span>
              <span>\xB7</span>
              <span>EDITED <strong><span class="ds-cipher" data-cipher-set="time">0:14</span> AGO</strong></span>
              <span>\xB7</span>
              <span>SYNCED</span>
            </div>
          </div>
          <div class="active-slot__stat">
            <span class="active-slot__stat-num">${coverageCount}</span>
            <span class="active-slot__stat-den">/ 92</span>
            <span class="active-slot__stat-label">essentials<br>covered</span>
          </div>
        </div>
      </header>
      <div class="active-slot__items">${rowsHTML}</div>
      <div class="active-slot__actions">
        <button class="cart-action cart-action--primary" data-rg-action="add-item">
          <span class="cart-action__glyph">+</span>ADD ITEM
        </button>
        <span class="cart-action__spacer"></span>
        <button class="cart-action" data-rg-action="save"><span class="cart-action__glyph">\u25A4</span>SAVE</button>
        <button class="cart-action" data-rg-action="duplicate"><span class="cart-action__glyph">\u21BB</span>DUPLICATE</button>
        <button class="cart-action" data-rg-action="import"><span class="cart-action__glyph">\u2193</span>IMPORT</button>
        <button class="cart-action" data-rg-action="export"><span class="cart-action__glyph">\u2191</span>EXPORT</button>
        <button class="cart-action" data-rg-action="vault"><span class="cart-action__glyph">\u2303</span>VAULT</button>
      </div>
    </section>
  `;
  }
  function renderRecItem(item) {
    const sign = item.contribution > 0 ? "+" : "";
    const tagText = item.contribution > 0 ? `${sign}${item.contribution}` : "\xB7";
    return `
    <div class="rec-item">
      <div class="rec-item__head">
        <h4 class="rec-item__name">${escHTML3(item.name)}</h4>
        <span class="rec-item__tag" data-heat="${escHTML3(item.heat)}"><span class="rec-item__tag-sign">${escHTML3(sign)}</span>${escHTML3(tagText)}</span>
      </div>
      <div class="rec-item__reason">${escHTML3(item.reason)}</div>
      <div class="rec-item__actions">
        <button class="rec-item__adopt" data-rg-action="adopt" data-item-name="${escHTML3(item.name)}">+ ADOPT</button>
        <button class="rec-item__details" data-rg-action="details" data-item-name="${escHTML3(item.name)}">DETAILS</button>
      </div>
    </div>
  `;
  }
  function renderRail2() {
    const userGoals = loadRgUserGoals();
    const hasGoals = userGoals !== null && userGoals.length > 0;
    const recsHTML = hasGoals ? RECOMMENDATIONS.map(renderRecItem).join("") : '<div class="rec-item rec-item--empty"><div class="rec-item__reason">Set a goal to see personalized recommendations.</div></div>';
    const wishHTML = WISHLIST.length > 0 ? WISHLIST.map(renderRecItem).join("") : '<div class="rec-item rec-item--empty"><div class="rec-item__reason">No items saved for later.</div></div>';
    return `
    <aside class="regimen-side">
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">RECOMMENDED \xB7 GOAL-DRIVEN</div>
          <h3 class="side-panel__title">CLOSES YOUR GAPS</h3>
        </header>
        <div class="side-panel__list">${recsHTML}</div>
      </section>
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">WISHLIST \xB7 SAVED-FOR-LATER</div>
          <h3 class="side-panel__title">DECISIONS DEFERRED</h3>
        </header>
        <div class="side-panel__list">${wishHTML}</div>
      </section>
    </aside>
  `;
  }
  var CIPHER_SETS3 = {
    hexa: "0123456789ABCDEF",
    alphanum: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numfrac: "0123456789",
    time: "0123456789:\xB7"
  };
  var cipherInterval3 = null;
  var cipherTickCount2 = 0;
  function startCipherEngine3(container) {
    if (cipherInterval3 !== null) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    cipherInterval3 = window.setInterval(() => {
      cipherTickCount2 += 1;
      const elements = Array.from(container.querySelectorAll(".ds-cipher"));
      for (const el of elements) {
        let original = el.dataset["cipherOriginal"];
        if (original === void 0) {
          original = el.textContent ?? "";
          el.dataset["cipherOriginal"] = original;
          const setKey = el.dataset["cipherSet"] ?? "alphanum";
          el.dataset["cipherSetResolved"] = CIPHER_SETS3[setKey] ?? CIPHER_SETS3["alphanum"] ?? "";
        }
        const set2 = el.dataset["cipherSetResolved"] ?? "";
        if (cipherTickCount2 % 5 === 0) {
          el.textContent = original;
          continue;
        }
        if (original.length === 0 || set2.length === 0) {
          continue;
        }
        const chars = original.split("");
        const i = Math.floor(Math.random() * chars.length);
        const charAt = chars[i];
        if (charAt === void 0) {
          continue;
        }
        if (!/[A-Z0-9·:]/i.test(charAt)) {
          continue;
        }
        const newChar = set2[Math.floor(Math.random() * set2.length)] ?? charAt;
        chars[i] = newChar;
        el.textContent = chars.join("");
      }
    }, 1e3);
  }
  function stopCipherEngine3() {
    if (cipherInterval3 !== null) {
      window.clearInterval(cipherInterval3);
      cipherInterval3 = null;
    }
  }
  function handleAction(action, target) {
    const w = window;
    const slotId = target.closest("[data-slot-id]")?.dataset["slotId"];
    switch (action) {
      case "save":
        if (slotId !== void 0 && typeof w.saveCurrentToSlot === "function") {
          try {
            w.saveCurrentToSlot(slotId);
          } catch (e) {
            console.warn("[views/regimen] saveCurrentToSlot threw:", e);
          }
        }
        break;
      case "new-cartridge":
        if (typeof w.showSlotInputModal === "function") {
          try {
            w.showSlotInputModal();
          } catch (e) {
            console.warn("[views/regimen] showSlotInputModal threw:", e);
          }
        }
        break;
      case "export":
        if (typeof w.exportRegimen === "function") {
          try {
            w.exportRegimen();
          } catch (e) {
            console.warn("[views/regimen] exportRegimen threw:", e);
          }
        }
        break;
      case "import":
        if (typeof w.importRegimen === "function") {
          try {
            w.importRegimen();
          } catch (e) {
            console.warn("[views/regimen] importRegimen threw:", e);
          }
        }
        break;
      case "vault":
        if (typeof w.showVaultModal === "function") {
          try {
            w.showVaultModal();
          } catch (e) {
            console.warn("[views/regimen] showVaultModal threw:", e);
          }
        }
        break;
      case "remove": {
        const idStr = target.dataset["itemId"];
        const id = idStr === void 0 ? Number.NaN : Number(idStr);
        if (Number.isFinite(id)) {
          const removed = loadRgRemoved();
          removed.add(id);
          saveRgRemoved(removed);
        }
        break;
      }
      default:
        break;
    }
  }
  function handleDoseEdit(input) {
    const idStr = input.dataset["itemId"];
    const id = idStr === void 0 ? Number.NaN : Number(idStr);
    if (!Number.isFinite(id)) {
      return;
    }
    const row = input.closest(".regimen-item-row");
    if (row === null) {
      return;
    }
    const amount = readDose(row.querySelector('[data-rg-dose="amount"]')?.value);
    const freq = readDose(row.querySelector('[data-rg-dose="freq"]')?.value);
    saveRgOverride(id, { dose_amount: amount, dose_freq: freq, scaling_factor: amount * freq });
  }
  var cachedVault = null;
  function readVault() {
    if (cachedVault !== null) {
      return cachedVault;
    }
    const m = /* @__PURE__ */ new Map();
    const el = typeof document === "undefined" ? null : document.getElementById("regimen-label-lookup");
    if (el !== null) {
      let parsed;
      try {
        parsed = JSON.parse(el.textContent ?? "{}");
      } catch {
        parsed = {};
      }
      let root = parsed;
      if (parsed !== null && typeof parsed === "object" && "products" in parsed) {
        root = parsed.products;
      }
      const rec = ProductsLookupSchema.safeParse(root);
      if (rec.success) {
        for (const value of Object.values(rec.data)) {
          const candidates = Array.isArray(value) ? value : [value];
          for (const candidate of candidates) {
            const r = RegimenVaultEntrySchema.safeParse(candidate);
            const nm = r.success ? r.data.canonical_name ?? r.data.name : void 0;
            if (typeof nm === "string" && nm.length > 0 && r.success) {
              m.set(nm.toLowerCase(), r.data);
            }
          }
        }
      }
    }
    cachedVault = m;
    return m;
  }
  function addItem(rawName) {
    const product = readVault().get(rawName.trim().toLowerCase());
    if (product === void 0) {
      return;
    }
    const item = {
      id: Date.now(),
      label: { name: product.canonical_name ?? product.name ?? rawName, nutrients: product.nutrients ?? [] },
      addedDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      provenance: "user_manual"
    };
    saveRgManual([...loadRgManual(), item]);
  }
  function renderAddRow() {
    const names = [...readVault().values()].map((p) => p.canonical_name ?? p.name).filter((n) => typeof n === "string").sort((a, b) => a.localeCompare(b));
    const options = names.map((n) => `<option value="${escHTML3(n)}"></option>`).join("");
    return `
    <section class="active-slot rg-add-panel">
      <div class="search-wrap">
        <input class="search-input" type="text" list="rg-product-options" data-rg-add-input placeholder="Search the product vault\u2026" autocomplete="off" />
        <datalist id="rg-product-options">${options}</datalist>
      </div>
      <div class="active-slot__actions">
        <button class="cart-action cart-action--primary" data-rg-action="add-confirm"><span class="cart-action__glyph">+</span>ADD TO STACK</button>
        <button class="cart-action" data-rg-action="add-cancel">CANCEL</button>
      </div>
    </section>
  `;
  }
  function mount3(container) {
    let pickerOpen = false;
    const render = () => {
      const items = loadEffectiveRegimen();
      const coverageCount = getOrCompute().coveredCount;
      const overrides = loadRgOverrides();
      container.innerHTML = `
      <div class="regimen-grid">
        <div class="regimen-main">
          ${renderSlotsShowcase()}
          ${renderActiveSlot(items, coverageCount, overrides)}
          ${pickerOpen ? renderAddRow() : ""}
        </div>
        ${renderRail2()}
      </div>
    `;
    };
    const clickHandler = (ev) => {
      const target = ev.target;
      if (target === null) {
        return;
      }
      const actionEl = target.closest("[data-rg-action]");
      if (actionEl === null) {
        return;
      }
      const action = actionEl.dataset["rgAction"] ?? "";
      if (action === "add-item") {
        pickerOpen = !pickerOpen;
        render();
        if (pickerOpen) {
          container.querySelector("[data-rg-add-input]")?.focus();
        }
        return;
      }
      if (action === "add-cancel") {
        pickerOpen = false;
        render();
        return;
      }
      if (action === "add-confirm") {
        const input = container.querySelector("[data-rg-add-input]");
        if (input !== null) {
          addItem(input.value);
        }
        pickerOpen = false;
        render();
        return;
      }
      handleAction(action, actionEl);
    };
    const changeHandler = (ev) => {
      const target = ev.target;
      const doseEl = target?.closest("[data-rg-dose]") ?? null;
      if (doseEl !== null) {
        handleDoseEdit(doseEl);
      }
    };
    render();
    startCipherEngine3(container);
    container.addEventListener("click", clickHandler);
    container.addEventListener("change", changeHandler);
    const unsubRegimen = on("regimen:changed", () => render());
    const unsubCoverage = on("coverage:recomputed", () => render());
    return {
      update: render,
      unmount: () => {
        unsubRegimen();
        unsubCoverage();
        stopCipherEngine3();
        container.removeEventListener("click", clickHandler);
        container.removeEventListener("change", changeHandler);
        container.innerHTML = "";
      }
    };
  }

  // assets/js/src/views/scanner.ts
  function escHTML4(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);
  }
  function verdictPillClass(v) {
    if (v === "ADD") {
      return "verdict-pill verdict-pill--ok";
    }
    if (v === "SAVE") {
      return "verdict-pill verdict-pill--warn";
    }
    return "verdict-pill verdict-pill--err";
  }
  function verdictHeadline(v) {
    if (v === "ADD") {
      return "ALIGNS WITH <em>WALLACH DOCTRINE</em>";
    }
    if (v === "SAVE") {
      return "PARTIAL \xB7 <em>WORTH CONSIDERING</em>";
    }
    return "DOES NOT ALIGN \xB7 <em>FLAGGED FOR REVIEW</em>";
  }
  function renderStageEmpty() {
    return `
    <div class="scan-canvas scan-canvas--empty" data-sc-action="upload-click">
      <div class="scan-canvas__drop-mark">\u2316</div>
      <div class="scan-canvas__drop-headline">Drop a label image \xB7 or paste \xB7 or click to upload</div>
      <div class="scan-canvas__drop-sub">// JPG \xB7 PNG \xB7 WEBP \xB7 HEIC \u2014 OCR runs locally, no upload to server</div>
      <div class="scan-canvas__drop-formats">
        <span>JPG</span><span>PNG</span><span>WEBP</span><span>HEIC</span>
      </div>
    </div>
  `;
  }
  function renderLabelBlock(label) {
    const brand = (label.brand ?? "YOUNGEVITY").toString();
    const product = (label.name ?? "(unnamed)").toString();
    const servings = label.servings === void 0 ? "\u2014 \xB7 \u2014 servings" : String(label.servings);
    const nutrientRows = (label.nutrients ?? []).slice(0, 8).map((n) => `
    <div class="scan-label__row">
      <span>${escHTML4(n.name)}</span>
      <span>${escHTML4(n.amount ?? "")}${escHTML4(n.unit ?? "")}</span>
      <span>\u2014</span>
    </div>
  `).join("");
    return `
    <div class="scan-canvas scan-canvas--active">
      <div class="scan-label">
        <div class="scan-label__brand">${escHTML4(brand)}</div>
        <div class="scan-label__product">${escHTML4(product)}</div>
        <div class="scan-label__rule"></div>
        <h4 class="scan-label__section-title">Supplement Facts</h4>
        <div class="scan-label__serving">Serving Size \xB7 ${escHTML4(servings)}</div>
        <div class="scan-label__rows">${nutrientRows}</div>
        <span class="ocr-bracket ocr-bracket--brand"></span>
        <span class="ocr-bracket ocr-bracket--product"></span>
        <span class="ocr-bracket ocr-bracket--serving"></span>
        <span class="ocr-bracket ocr-bracket--rows"></span>
      </div>
    </div>
  `;
  }
  function renderStage(state, result) {
    const canvasHTML = state === "result" && result !== null ? renderLabelBlock(result.label) : renderStageEmpty();
    const regionCount = result?.label.nutrients?.length ?? 0;
    const confidence = result?.alignment.score.toFixed(2) ?? "\u2014";
    const controlsActive = state === "result" && result !== null;
    const metaHTML = controlsActive ? `
    <span>CAPTURE <strong class="ds-cipher" data-cipher-set="hexa">SC\xB7B14F</strong></span>
    <span>\xB7</span>
    <span>${regionCount} REGIONS</span>
    <span>\xB7</span>
    <span>CONFIDENCE <strong>${escHTML4(confidence)}</strong></span>
  ` : `
    <span>CAPTURE <strong class="ds-cipher" data-cipher-set="hexa">SC\xB7----</strong></span>
    <span>\xB7</span>
    <span>0 REGIONS</span>
    <span>\xB7</span>
    <span>READY</span>
  `;
    return `
    <section class="scan-stage">
      <header class="scan-stage__head">
        <div>
          <div class="scan-stage__kicker"><span class="pulse-dot"></span>STAGE \xB7 <span class="ds-cipher" data-cipher-set="hexa">CS\xB712B4</span></div>
          <h2 class="scan-stage__title">
            ${state === "result" ? "CAPTURED" : "DROP A LABEL"}
            <em>// ${state === "result" ? "OCR + Eden grammar + vault lookup" : "image goes here \u2014 paste, drop, upload"}</em>
          </h2>
        </div>
        <div class="scan-stage__head-stat">
          <span>RESOLUTION <strong>${state === "result" ? "1080\xD71620" : "\u2014"}</strong></span>
          <span>\xB7</span>
          <span>CAPTURE <strong class="ds-cipher" data-cipher-set="time">${state === "result" ? "0:08" : "\u2014"}</strong> AGO</span>
        </div>
      </header>
      ${canvasHTML}
      <div class="scan-stage__controls">
        <span class="scan-stage__meta">${metaHTML}</span>
        <span class="scan-stage__spacer"></span>
        <button class="scan-btn" data-sc-action="retake"><span class="scan-btn__glyph">\u21BA</span>RETAKE</button>
        <button class="scan-btn" data-sc-action="upload"><span class="scan-btn__glyph">\u2303</span>UPLOAD</button>
        <button class="scan-btn" data-sc-action="crop"><span class="scan-btn__glyph">\u2316</span>CROP</button>
      </div>
    </section>
  `;
  }
  function pipelineStages(state) {
    const allDone = [
      { name: "EXTRACT", sub: "tesseract OCR", ms: "1.42s", status: "done" },
      { name: "PARSE", sub: "Eden grammar", ms: "0.31s", status: "done" },
      { name: "MATCH", sub: "vault lookup", ms: "2.11s", status: "done" },
      { name: "VERDICT", sub: "Wallach align", ms: "0.18s", status: "done" }
    ];
    if (state === "idle") {
      return allDone.map((s) => ({ ...s, ms: "\u2014", status: "queued" }));
    }
    if (state === "scanning") {
      return [
        { name: "EXTRACT", sub: "tesseract OCR", ms: "1.42s", status: "done" },
        { name: "PARSE", sub: "Eden grammar", ms: "0.31s", status: "done" },
        { name: "MATCH", sub: "vault lookup", ms: "2.11s", status: "active" },
        { name: "VERDICT", sub: "Wallach align", ms: "\u2014", status: "queued" }
      ];
    }
    return allDone;
  }
  function renderPipeline(state) {
    const stages = pipelineStages(state);
    const stagesHTML = stages.map((s) => {
      const dotChar = s.status === "done" ? "\u2713" : s.status === "active" ? "\u25CF" : "\u25CB";
      return `
      <div class="stage stage--${s.status}">
        <div class="stage__dot">${dotChar}</div>
        <div class="stage__name">${escHTML4(s.name)}</div>
        <div class="stage__sub">${escHTML4(s.sub)}</div>
        <div class="stage__ms">${s.status === "active" ? `<span class="ds-cipher" data-cipher-set="alphanum">${escHTML4(s.ms)}</span>` : escHTML4(s.ms)}</div>
      </div>
    `;
    }).join("");
    const total = state === "result" ? "3.84s" : state === "scanning" ? "2.84s" : "\u2014";
    return `
    <section class="pipeline">
      <header class="pipeline__head">
        <div>
          <div class="pipeline__eyebrow">PIPELINE \xB7 <span class="ds-cipher" data-cipher-set="hexa">PL\xB724A7</span> \xB7 4 STAGES</div>
          <h2 class="pipeline__title">Extract \xB7 Parse \xB7 Match \xB7 Verdict</h2>
        </div>
        <div class="pipeline__total">TOTAL ELAPSED <strong>${escHTML4(total)}</strong> \xB7 target &lt;5s</div>
      </header>
      <div class="pipeline__stages">${stagesHTML}</div>
    </section>
  `;
  }
  function renderParsedRow(row) {
    const statusChar = row.status === "ok" ? "\u2713" : row.status === "warn" ? "?" : "\xD7";
    const adoptLabel = row.status === "warn" ? "CONFIRM" : row.status === "err" ? "DISMISS" : "ADOPT";
    const adoptClass = row.status === "err" ? "parsed-row__btn" : "parsed-row__btn parsed-row__btn--adopt";
    const mappedClass = row.status === "err" ? "parsed-row__mapped parsed-row__mapped--none" : "parsed-row__mapped";
    const tagSignHTML = row.tag.sign !== void 0 ? `<span class="parsed-row__tag-sign">${escHTML4(row.tag.sign)}</span>` : "";
    return `
    <div class="parsed-row parsed-row--${row.status}">
      <div class="parsed-row__status">${statusChar}</div>
      <div class="parsed-row__body">
        <span class="parsed-row__raw">"${escHTML4(row.raw)}"</span>
        <h4 class="parsed-row__name">${escHTML4(row.name)}</h4>
      </div>
      <span class="${mappedClass}">\u2192 ${escHTML4(row.mapped)}</span>
      <span class="parsed-row__confidence">${escHTML4(row.confidence)} <small>conf</small></span>
      <span class="parsed-row__tag" data-heat="${escHTML4(row.tag.heat)}">${tagSignHTML}${escHTML4(row.tag.text)}</span>
      <div class="parsed-row__actions">
        <button class="parsed-row__btn" data-sc-action="details">DETAILS</button>
        <button class="${adoptClass}" data-sc-action="${row.status === "err" ? "dismiss" : "adopt"}">${adoptLabel}</button>
      </div>
    </div>
  `;
  }
  function parsedRowsFromResult(result) {
    if (result === null) {
      return [];
    }
    return result.gapFills.map((g) => {
      const heatKey = g.gapFillPct >= 0.5 ? "xl" : g.gapFillPct >= 0.2 ? "lg" : g.gapFillPct >= 0.1 ? "md" : "sm";
      return {
        status: "ok",
        raw: g.essential.toLowerCase(),
        name: g.essential,
        mapped: `\u2192 ${g.essential.toLowerCase()}`,
        confidence: "0.95",
        tag: { heat: heatKey, sign: "+", text: String(Math.round(g.gapFillPct * 100)) }
      };
    });
  }
  function renderParsed(result) {
    const rows = parsedRowsFromResult(result);
    const rowsHTML = rows.length > 0 ? rows.map(renderParsedRow).join("") : '<div class="parsed-row parsed-row--empty"><div class="parsed-row__body"><span class="parsed-row__raw">\u2014 scan a label to populate this list \u2014</span></div></div>';
    return `
    <section class="parsed">
      <header class="parsed__head">
        <div>
          <div class="parsed__eyebrow">INGREDIENTS \xB7 <span class="ds-cipher" data-cipher-set="hexa">IG\xB756D2</span> \xB7 ${rows.length} DETECTED</div>
          <h2 class="parsed__title">Parsed &amp; Mapped</h2>
        </div>
        <div class="parsed__legend">
          <span class="parsed__legend-key"><span class="dot dot--ok"></span>VAULT HIT</span>
          <span class="parsed__legend-key"><span class="dot dot--warn"></span>FUZZY MATCH</span>
          <span class="parsed__legend-key"><span class="dot dot--err"></span>UNKNOWN</span>
        </div>
      </header>
      <div class="parsed__list">${rowsHTML}</div>
    </section>
  `;
  }
  function renderVerdict(result) {
    if (result === null) {
      return `
      <section class="verdict verdict--empty">
        <div class="verdict__grid">
          <div class="verdict__lead">
            <div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT \xB7 awaiting scan</div>
            <h2 class="verdict__headline">NO LABEL LOADED YET</h2>
            <p class="verdict__body">Drop, paste, or upload a label image to begin. OCR runs locally; no data leaves your machine.</p>
          </div>
        </div>
      </section>
    `;
    }
    const headline = verdictHeadline(result.verdict);
    const added = result.gapFills.length;
    const traces = result.gapFills.filter((g) => g.gapFillPct < 0.05).length;
    const anti = result.anti.length;
    return `
    <section class="verdict">
      <div class="verdict__grid">
        <div class="verdict__lead">
          <div class="verdict__eyebrow"><span class="pulse-dot"></span>VERDICT \xB7 <span class="ds-cipher" data-cipher-set="hexa">VD\xB781E3</span> \xB7 WALLACH ALIGNMENT</div>
          <h2 class="verdict__headline">${headline}</h2>
          <p class="verdict__body">
            ${result.reasonsFor[0]?.label ?? "Scan complete."}
            ${anti > 0 ? `${anti} item${anti === 1 ? "" : "s"} flagged for review.` : ""}
          </p>
          <div class="verdict__source">CITED \xB7 <strong>Wallach corpus \u2014 alignment per source-rule allowlist</strong></div>
        </div>
        <div class="verdict__stats">
          <div class="verdict-stat">
            <div class="verdict-stat__num">+${added}<small>/92</small></div>
            <div class="verdict-stat__label">essentials added to coverage</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat__num">${traces}</div>
            <div class="verdict-stat__label">trace tiles closed</div>
          </div>
          <div class="verdict-stat ${anti > 0 ? "verdict-stat--warn" : ""}">
            <div class="verdict-stat__num">${anti}</div>
            <div class="verdict-stat__label">items flagged</div>
          </div>
          <div class="verdict-stat">
            <div class="verdict-stat__num">${result.alignment.aligned}/${result.alignment.total}</div>
            <div class="verdict-stat__label">aligned \xB7 ${(result.alignment.score * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>
    </section>
  `;
  }
  function renderHistoryEntry(entry) {
    const name = entry.label.name || "(unnamed)";
    const verdictText = entry.verdict;
    const pillClass = verdictPillClass(entry.verdict);
    return `
    <div class="scan-history-item" data-sc-action="reopen" data-scan-id="${entry.id}">
      <div class="scan-history-item__body">
        <h4 class="scan-history-item__name">${escHTML4(name)}</h4>
        <span class="scan-history-item__ts">${escHTML4(entry.ts.slice(0, 16))}</span>
      </div>
      <span class="${pillClass}">${escHTML4(verdictText)}</span>
    </div>
  `;
  }
  function renderRail3() {
    const history = getHistory();
    const itemsHTML = history.length > 0 ? history.slice(0, 12).map(renderHistoryEntry).join("") : '<div class="scan-history-item scan-history-item--empty"><div class="scan-history-item__body"><h4 class="scan-history-item__name">\u2014 no scans yet \u2014</h4></div></div>';
    return `
    <aside class="scanner-side">
      <section class="side-panel">
        <header class="side-panel__head">
          <div class="side-panel__eyebrow">SCAN HISTORY \xB7 ${history.length} TOTAL</div>
          <h3 class="side-panel__title">PAST CAPTURES</h3>
        </header>
        <div class="side-panel__list">${itemsHTML}</div>
      </section>
    </aside>
  `;
  }
  var CIPHER_SETS4 = {
    hexa: "0123456789ABCDEF",
    alphanum: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    numfrac: "0123456789",
    time: "0123456789:\xB7"
  };
  var cipherInterval4 = null;
  var cipherTickCount3 = 0;
  function startCipherEngine4(container) {
    if (cipherInterval4 !== null) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    cipherInterval4 = window.setInterval(() => {
      cipherTickCount3 += 1;
      const elements = Array.from(container.querySelectorAll(".ds-cipher"));
      for (const el of elements) {
        let original = el.dataset["cipherOriginal"];
        if (original === void 0) {
          original = el.textContent ?? "";
          el.dataset["cipherOriginal"] = original;
          const setKey = el.dataset["cipherSet"] ?? "alphanum";
          el.dataset["cipherSetResolved"] = CIPHER_SETS4[setKey] ?? CIPHER_SETS4["alphanum"] ?? "";
        }
        const set2 = el.dataset["cipherSetResolved"] ?? "";
        if (cipherTickCount3 % 5 === 0) {
          el.textContent = original;
          continue;
        }
        if (original.length === 0 || set2.length === 0) {
          continue;
        }
        const chars = original.split("");
        const i = Math.floor(Math.random() * chars.length);
        const charAt = chars[i];
        if (charAt === void 0) {
          continue;
        }
        if (!/[A-Z0-9·:]/i.test(charAt)) {
          continue;
        }
        const newChar = set2[Math.floor(Math.random() * set2.length)] ?? charAt;
        chars[i] = newChar;
        el.textContent = chars.join("");
      }
    }, 1e3);
  }
  function stopCipherEngine4() {
    if (cipherInterval4 !== null) {
      window.clearInterval(cipherInterval4);
      cipherInterval4 = null;
    }
  }
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });
  }
  async function handleImageFile(file) {
    const w = window;
    if (typeof w.lcScanImage !== "function") {
      console.warn("[views/scanner] window.lcScanImage not available \u2014 legacy not loaded");
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      w.lcScanImage(dataUrl);
    } catch (e) {
      console.warn("[views/scanner] failed to read image:", e);
    }
  }
  function mount4(container) {
    let state = "idle";
    const currentResult = () => {
      const w = window;
      return w.lcLastResult ?? null;
    };
    const render = () => {
      const result = currentResult();
      if (result !== null && state === "idle") {
        state = "result";
      }
      container.innerHTML = `
      <div class="scanner-grid">
        <div class="scanner-main">
          ${renderStage(state, result)}
          ${renderPipeline(state)}
          ${renderParsed(result)}
          ${renderVerdict(result)}
        </div>
        ${renderRail3()}
      </div>
    `;
    };
    const clickHandler = (ev) => {
      const target = ev.target;
      if (target === null) {
        return;
      }
      const actionEl = target.closest("[data-sc-action]");
      if (actionEl === null) {
        return;
      }
      const action = actionEl.dataset["scAction"] ?? "";
      if (action === "upload" || action === "upload-click" || action === "retake") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.addEventListener("change", () => {
          const file = input.files?.[0];
          if (file !== void 0) {
            void handleImageFile(file);
            state = "scanning";
            render();
          }
        });
        input.click();
      }
    };
    const dragHandler = (ev) => {
      ev.preventDefault();
    };
    const dropHandler = (ev) => {
      ev.preventDefault();
      const file = ev.dataTransfer?.files[0];
      if (file !== void 0) {
        void handleImageFile(file);
        state = "scanning";
        render();
      }
    };
    const pasteHandler = (ev) => {
      const items = ev.clipboardData?.items;
      if (items === void 0) {
        return;
      }
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file !== null) {
            void handleImageFile(file);
            state = "scanning";
            render();
            return;
          }
        }
      }
    };
    render();
    startCipherEngine4(container);
    container.addEventListener("click", clickHandler);
    container.addEventListener("dragover", dragHandler);
    container.addEventListener("drop", dropHandler);
    document.addEventListener("paste", pasteHandler);
    const unsubComplete = on("scanner:scan-complete", () => {
      state = "result";
      render();
    });
    const unsubCleared = on("scanner:scan-cleared", () => {
      state = "idle";
      render();
    });
    return {
      update: render,
      unmount: () => {
        unsubComplete();
        unsubCleared();
        stopCipherEngine4();
        container.removeEventListener("click", clickHandler);
        container.removeEventListener("dragover", dragHandler);
        container.removeEventListener("drop", dropHandler);
        document.removeEventListener("paste", pasteHandler);
        container.innerHTML = "";
      }
    };
  }

  // assets/js/src/main.ts
  var LEGACY_TAB_FOR = {
    coverage: "tab-stand",
    regimen: "tab-regimen",
    scanner: "tab-tools",
    knowledge: "tab-why",
    journey: "tab-journey"
  };
  var mounted = {};
  function getLegacyHost() {
    return document.getElementById("legacy-workspace-host");
  }
  function showLegacy(target) {
    const host = getLegacyHost();
    if (host === null) {
      return;
    }
    host.style.display = "";
    const legacyTabId = LEGACY_TAB_FOR[target];
    const w = window;
    if (typeof w.showTab === "function") {
      try {
        w.showTab(legacyTabId);
      } catch (e) {
        console.warn("[main] legacy showTab threw:", e);
      }
    }
  }
  function hideLegacy() {
    const host = getLegacyHost();
    if (host !== null) {
      host.style.display = "none";
    }
  }
  function hideAllNewMounts() {
    for (const id of ["workspace-coverage-mount", "workspace-regimen-mount", "workspace-scanner-mount"]) {
      const el = document.getElementById(id);
      if (el !== null) {
        el.style.display = "none";
      }
    }
  }
  function activateRailItem(target) {
    for (const btn of Array.from(document.querySelectorAll(".rail__item"))) {
      btn.classList.toggle("active", btn.getAttribute("data-rail-nav") === target);
    }
  }
  function navigateTo(target) {
    activateRailItem(target);
    emit("rail:navigate", { target });
    hideAllNewMounts();
    if (target === "coverage") {
      hideLegacy();
      const mountEl = document.getElementById("workspace-coverage-mount");
      if (mountEl === null) {
        return;
      }
      mountEl.style.display = "block";
      if (mounted.coverage === void 0) {
        mounted.coverage = mount(mountEl);
      }
      return;
    }
    if (target === "regimen") {
      hideLegacy();
      const mountEl = document.getElementById("workspace-regimen-mount");
      if (mountEl === null) {
        return;
      }
      mountEl.style.display = "block";
      if (mounted.regimen === void 0) {
        mounted.regimen = mount3(mountEl);
      }
      return;
    }
    if (target === "scanner") {
      hideLegacy();
      const mountEl = document.getElementById("workspace-scanner-mount");
      if (mountEl === null) {
        return;
      }
      mountEl.style.display = "block";
      if (mounted.scanner === void 0) {
        mounted.scanner = mount4(mountEl);
      }
      return;
    }
    showLegacy(target);
  }
  function wireRail() {
    for (const btn of Array.from(document.querySelectorAll(".rail__item[data-rail-nav]"))) {
      const target = btn.getAttribute("data-rail-nav");
      if (target === null) {
        continue;
      }
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        navigateTo(target);
      });
    }
  }
  var profileHandle = null;
  var profileOverlay = null;
  function hideProfilePanel() {
    if (profileHandle !== null) {
      profileHandle.unmount();
      profileHandle = null;
    }
    if (profileOverlay !== null) {
      profileOverlay.remove();
      profileOverlay = null;
    }
  }
  function showProfilePanel() {
    if (profileOverlay !== null) {
      return;
    }
    const overlay = document.createElement("div");
    overlay.className = "pf-overlay";
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) {
        hideProfilePanel();
      }
    });
    overlay.addEventListener("pf:close", () => hideProfilePanel());
    document.body.appendChild(overlay);
    profileOverlay = overlay;
    profileHandle = mount2(overlay);
  }
  function wireProfileChip() {
    const chip = document.querySelector(".rail__profile");
    if (chip === null) {
      return;
    }
    chip.style.cursor = "pointer";
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.addEventListener("click", () => showProfilePanel());
    chip.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        showProfilePanel();
      }
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && profileOverlay !== null) {
        hideProfilePanel();
      }
    });
  }
  function bootstrap() {
    console.warn("[wallach\xB7sys v3.27] dashboard module graph loaded \xB7 Round 2 (Coverage migrated)");
    try {
      installRecomputeTrigger();
    } catch (e) {
      console.warn("[main] installRecomputeTrigger threw:", e);
    }
    wireRail();
    wireProfileChip();
    setTimeout(() => navigateTo("coverage"), 0);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
//# sourceMappingURL=main.js.map
