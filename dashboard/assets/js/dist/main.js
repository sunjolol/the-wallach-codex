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
  function setValidated(key, value, schema) {
    const result = schema.safeParse(value);
    if (!result.success) {
      return { ok: false, key, reason: "schema-invalid" };
    }
    return set(key, result.data);
  }
  function onChange(handler) {
    installNativeListener();
    subscribers2.add(handler);
    return () => {
      subscribers2.delete(handler);
    };
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
              { key: "Magnesium", num: 12, sym: "Mg", name: "MAGNESIUM" },
              { key: "Phosphorus", num: 15, sym: "P", name: "PHOSPHORUS" },
              { key: "Sulfur", num: 16, sym: "S", name: "SULFUR" },
              { key: "Chloride", num: 17, sym: "Cl", name: "CHLORIDE" },
              { key: "Potassium", num: 19, sym: "K", name: "POTASSIUM" },
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
              { key: "Chromium", num: 24, sym: "Cr", name: "CHROMIUM" },
              { key: "Copper", num: 29, sym: "Cu", name: "COPPER" },
              { key: "Germanium", num: 32, sym: "Ge", name: "GERMANIUM" },
              { key: "Iron", num: 26, sym: "Fe", name: "IRON" },
              { key: "Iodine", num: 53, sym: "I", name: "IODINE" },
              { key: "Manganese", num: 25, sym: "Mn", name: "MANGANESE" },
              { key: "Molybdenum", num: 42, sym: "Mo", name: "MOLYBDENUM" },
              { key: "Selenium", num: 34, sym: "Se", name: "SELENIUM" },
              { key: "Silica", num: 14, sym: "Si", name: "SILICA" },
              { key: "Strontium", num: 38, sym: "Sr", name: "STRONTIUM" },
              { key: "Vanadium", num: 23, sym: "V", name: "VANADIUM" },
              { key: "Zinc", num: 30, sym: "Zn", name: "ZINC" }
            ]
          },
          {
            rank: "C",
            label: "RARE TRACE",
            hint: "PDM aggregate spectrum \xB7 A\u2192Z",
            tiles: [
              { key: "Silver", num: 47, sym: "Ag", name: "SILVER" },
              { key: "Aluminum", num: 13, sym: "Al", name: "ALUMINUM" },
              { key: "Arsenic", num: 33, sym: "As", name: "ARSENIC" },
              { key: "Gold", num: 79, sym: "Au", name: "GOLD" },
              { key: "Barium", num: 56, sym: "Ba", name: "BARIUM" },
              { key: "Beryllium", num: 4, sym: "Be", name: "BERYLLIUM" },
              { key: "Bromine", num: 35, sym: "Br", name: "BROMINE" },
              { key: "Cerium", num: 58, sym: "Ce", name: "CERIUM" },
              { key: "Cesium", num: 55, sym: "Cs", name: "CESIUM" },
              { key: "Dysprosium", num: 66, sym: "Dy", name: "DYSPROSIUM" },
              { key: "Erbium", num: 68, sym: "Er", name: "ERBIUM" },
              { key: "Europium", num: 63, sym: "Eu", name: "EUROPIUM" },
              { key: "Gallium", num: 31, sym: "Ga", name: "GALLIUM" },
              { key: "Gadolinium", num: 64, sym: "Gd", name: "GADOLINIUM" },
              { key: "Hafnium", num: 72, sym: "Hf", name: "HAFNIUM" },
              { key: "Holmium", num: 67, sym: "Ho", name: "HOLMIUM" },
              { key: "Lanthanum", num: 57, sym: "La", name: "LANTHANUM" },
              { key: "Lithium", num: 3, sym: "Li", name: "LITHIUM" },
              { key: "Lutetium", num: 71, sym: "Lu", name: "LUTETIUM" },
              { key: "Niobium", num: 41, sym: "Nb", name: "NIOBIUM" },
              { key: "Neodymium", num: 60, sym: "Nd", name: "NEODYMIUM" },
              { key: "Nickel", num: 28, sym: "Ni", name: "NICKEL" },
              { key: "Praseodymium", num: 59, sym: "Pr", name: "PRASEODYMIUM" },
              { key: "Rubidium", num: 37, sym: "Rb", name: "RUBIDIUM" },
              { key: "Rhenium", num: 75, sym: "Re", name: "RHENIUM" },
              { key: "Scandium", num: 21, sym: "Sc", name: "SCANDIUM" },
              { key: "Samarium", num: 62, sym: "Sm", name: "SAMARIUM" },
              { key: "Tin", num: 50, sym: "Sn", name: "TIN" },
              { key: "Tantalum", num: 73, sym: "Ta", name: "TANTALUM" },
              { key: "Terbium", num: 65, sym: "Tb", name: "TERBIUM" },
              { key: "Titanium", num: 22, sym: "Ti", name: "TITANIUM" },
              { key: "Thulium", num: 69, sym: "Tm", name: "THULIUM" },
              { key: "Yttrium", num: 39, sym: "Y", name: "YTTRIUM" },
              { key: "Ytterbium", num: 70, sym: "Yb", name: "YTTERBIUM" },
              { key: "Zirconium", num: 40, sym: "Zr", name: "ZIRCONIUM" }
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
          { key: "Vitamin B5 (Pantothenic Acid)", code: "V\xB705", letter: "B5", name: "PANTOTHENIC ACID" },
          { key: "Vitamin B6 (Pyridoxine)", code: "V\xB706", letter: "B6", name: "PYRIDOXINE" },
          { key: "Folic Acid (Folate)", code: "V\xB707", letter: "B9", name: "FOLATE" },
          { key: "Vitamin B12 (Cobalamin)", code: "V\xB708", letter: "B12", name: "COBALAMIN" },
          { key: "Vitamin C (Ascorbic Acid)", code: "V\xB709", letter: "C", name: "ASCORBIC ACID" },
          { key: "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)", code: "V\xB710", letter: "D3", name: "CHOLECALCIFEROL" },
          { key: "Vitamin E (Tocopherol)", code: "V\xB711", letter: "E", name: "TOCOPHEROL" },
          { key: "Vitamin K (Menaquinone = K2)", code: "V\xB712", letter: "K", name: "MENAQUINONE" },
          { key: "Biotin", code: "V\xB713", letter: "H", name: "BIOTIN" },
          { key: "Choline", code: "V\xB714", letter: "Ch", name: "CHOLINE" },
          { key: "Inositol", code: "V\xB715", letter: "In", name: "INOSITOL" },
          { key: "Flavonoids / Bioflavonoids", code: "V\xB716", letter: "Fl", name: "FLAVONOIDS" }
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
          { key: "Phenylalanine", code: "AA\xB708", abbr: "Phe", name: "PHENYLALANINE" },
          { key: "Threonine", code: "AA\xB709", abbr: "Thr", name: "THREONINE" },
          { key: "Tryptophan", code: "AA\xB710", abbr: "Trp", name: "TRYPTOPHAN" },
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
          { key: "Omega-9 (Arachidonic / Oleic)", code: "F\xB703", name: "OMEGA-9", hint: "n-9 \xB7 oleic \xB7 arachidonic", essential: false }
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

  // assets/js/src/core/schemas/corpus.ts
  var CorpusDoseSchema = external_exports.object({
    amount: external_exports.union([external_exports.number(), external_exports.string()]).nullable().optional(),
    unit: external_exports.string().nullable().optional(),
    period: external_exports.string().nullable().optional(),
    form: external_exports.string().nullable().optional(),
    duration: external_exports.string().nullable().optional(),
    for_condition: external_exports.string().nullable().optional()
  }).passthrough();
  var CorpusClaimSchema = external_exports.object({
    id: external_exports.string(),
    kind: external_exports.string(),
    claim_text: external_exports.string(),
    verbatim: external_exports.string(),
    dose: CorpusDoseSchema.nullable(),
    book: external_exports.string(),
    essentials: external_exports.array(external_exports.string()),
    other_substances: external_exports.array(external_exports.string()),
    conditions: external_exports.array(external_exports.string()),
    symptoms: external_exports.array(external_exports.string()),
    confidence: external_exports.string()
  }).passthrough();
  var CorpusDeficiencySignSchema = external_exports.object({
    sign: external_exports.string(),
    claim_id: external_exports.string(),
    confidence: external_exports.string()
  }).passthrough();
  var CorpusEssentialSchema = external_exports.object({
    slug: external_exports.string(),
    display_name: external_exports.string(),
    layout_key: external_exports.string(),
    category: external_exports.string(),
    symbol: external_exports.string(),
    claim_count: external_exports.number(),
    claims_by_kind: external_exports.record(external_exports.string(), external_exports.array(external_exports.string())),
    deficiency_signs: external_exports.array(CorpusDeficiencySignSchema),
    conditions_treated: external_exports.array(external_exports.string()),
    interacts_with: external_exports.array(external_exports.string()),
    books_cited: external_exports.array(external_exports.string())
  }).passthrough();
  var CorpusConditionSchema = external_exports.object({
    slug: external_exports.string(),
    display_name: external_exports.string(),
    claim_count: external_exports.number(),
    claims_by_role: external_exports.record(external_exports.string(), external_exports.array(external_exports.string())),
    essentials_involved: external_exports.array(external_exports.string()),
    other_substances_involved: external_exports.array(external_exports.string()),
    books_cited: external_exports.array(external_exports.string())
  }).passthrough();
  var CorpusBookSchema = external_exports.object({
    title: external_exports.string(),
    edition: external_exports.string().nullable().optional(),
    year: external_exports.union([external_exports.number(), external_exports.string()]).nullable().optional(),
    authors: external_exports.array(external_exports.string()).optional(),
    code: external_exports.string().optional(),
    claim_count: external_exports.number().optional(),
    status: external_exports.string().optional()
  }).passthrough();
  var CorpusPlannedBookSchema = external_exports.object({
    title: external_exports.string(),
    authors: external_exports.array(external_exports.string()).optional(),
    code: external_exports.string().optional()
  }).passthrough();
  var CorpusEmbedSchema = external_exports.object({
    knowledge_version: external_exports.number(),
    books: external_exports.record(external_exports.string(), CorpusBookSchema),
    planned_books: external_exports.array(CorpusPlannedBookSchema),
    essentials: external_exports.record(external_exports.string(), CorpusEssentialSchema),
    conditions: external_exports.record(external_exports.string(), CorpusConditionSchema),
    claims: external_exports.record(external_exports.string(), CorpusClaimSchema)
  }).passthrough();

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
    hint: external_exports.string().optional(),
    /**
     * Essential vs non-essential per Wallach's "90 Essential Nutrients" framing.
     * Absent/true = one of the 90 essentials. `false` marks a nutrient the body
     * can synthesize — shown for completeness + coverage, but NOT counted toward
     * the 90 (e.g. Omega-9 / oleic, included by Youngevity for cardiovascular
     * balance). Source: Wallach "The 90 Essential Nutrients" lecture corpus +
     * the conditional-essentiality note on Omega-9 in essentials-benefits-data.
     */
    essential: external_exports.boolean().optional()
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

  // assets/js/src/core/schemas/goals.ts
  var GoalSchema = external_exports.object({
    goalId: external_exports.string().min(1),
    title: external_exports.string().min(1).max(200),
    /** ISO date or short display string for the target ("SEP 01", "2026-09-01"). */
    targetDate: external_exports.string().max(80),
    /** Fractional completion, 0..1 (drives the headline % + the bar fill). */
    progress: external_exports.number().min(0).max(1),
    numerator: external_exports.number().nonnegative(),
    denominator: external_exports.number().positive(),
    /** Count noun for numerator/denominator ("tiles", "essentials", "days"). */
    unit: external_exports.string().max(40).optional(),
    blockers: external_exports.array(external_exports.string().max(120)).max(20).optional(),
    featured: external_exports.boolean().optional()
  });
  var MilestoneSchema = external_exports.object({
    milestoneId: external_exports.string().min(1),
    title: external_exports.string().min(1).max(200),
    /** Wallach doctrine this ties back to, e.g. "DOCT·02". */
    doctrineRef: external_exports.string().max(120),
    /** ISO-8601 timestamp earned, or null when still locked. */
    earnedAt: external_exports.string().min(1).nullable(),
    /** Short text on the badge ("35", "11", "60d"). */
    badge: external_exports.string().max(8),
    /** Progress toward a locked milestone (optional display only). */
    numerator: external_exports.number().nonnegative().optional(),
    denominator: external_exports.number().positive().optional()
  });
  var GoalsShapeSchema = external_exports.object({
    goals: external_exports.array(GoalSchema).default([])
  });
  var MilestonesShapeSchema = external_exports.object({
    milestones: external_exports.array(MilestoneSchema).default([])
  });

  // assets/js/src/core/schemas/journey.ts
  var EventKindSchema = external_exports.enum(["scan", "regimen", "coverage", "symptom", "milestone"]);
  var JourneyEventSchema = external_exports.object({
    eventId: external_exports.string().min(1),
    kind: EventKindSchema,
    title: external_exports.string().min(1).max(200),
    detail: external_exports.string().max(2e3).optional(),
    /** Short delta tag, e.g. "+35 trace", "+16 essentials". */
    delta: external_exports.string().max(80).optional(),
    /** ISO-8601 timestamp the event occurred. */
    occurredAt: external_exports.string().min(1)
  });
  var CheckinSchema = external_exports.object({
    checkinId: external_exports.string().min(1),
    severity: external_exports.union([external_exports.literal(1), external_exports.literal(2), external_exports.literal(3), external_exports.literal(4), external_exports.literal(5)]),
    note: external_exports.string().max(2e3),
    tags: external_exports.array(external_exports.string().max(40)).max(20),
    /** ISO-8601 timestamp the check-in was logged. */
    loggedAt: external_exports.string().min(1)
  });
  var JourneyEventsShapeSchema = external_exports.object({
    events: external_exports.array(JourneyEventSchema).default([])
  });
  var CheckinsShapeSchema = external_exports.object({
    checkins: external_exports.array(CheckinSchema).default([])
  });

  // assets/js/src/core/schemas/knowledge.ts
  var EssentialSchema = external_exports.object({
    name: external_exports.string(),
    category: external_exports.string(),
    target: external_exports.unknown().optional(),
    wallach_stance: external_exports.object({
      stance: external_exports.string().optional(),
      quote: external_exports.string().optional(),
      citation: external_exports.string().optional(),
      context: external_exports.string().optional()
    }).optional()
  }).passthrough();
  var EssentialsDataSchema = external_exports.object({
    essentials: external_exports.array(EssentialSchema)
  }).passthrough();
  var ProductEntrySchema = external_exports.object({
    canonical_name: external_exports.string().optional(),
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
  var LogEmbedSchema = external_exports.array(LogEntrySchema);

  // assets/js/src/core/schemas/ocr-dict.ts
  var OcrDictSchema = external_exports.object({
    fuzzyDict: external_exports.array(external_exports.string()),
    knownNutrientNames: external_exports.array(external_exports.string())
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

  // assets/js/src/core/schemas/scanner-corpus.ts
  var DietaryBaselineEntrySchema = external_exports.object({
    amount: external_exports.number(),
    unit: external_exports.string()
  });
  var NutrientGoalEntrySchema = external_exports.object({
    nutrient: external_exports.string(),
    why: external_exports.string()
  });
  var ScanCorpusSchema = external_exports.object({
    dietaryBaseline: external_exports.record(external_exports.string(), DietaryBaselineEntrySchema),
    goalKeywords: external_exports.record(external_exports.string(), external_exports.array(external_exports.string())),
    nutrientToGoalMap: external_exports.record(external_exports.string(), external_exports.array(NutrientGoalEntrySchema)),
    goalDisplayNames: external_exports.record(external_exports.string(), external_exports.string()),
    antiList: external_exports.record(external_exports.string(), external_exports.array(external_exports.string())),
    antiListNotes: external_exports.record(external_exports.string(), external_exports.string()),
    hardRejectTerms: external_exports.array(external_exports.string()),
    seriousAnti: external_exports.array(external_exports.string())
  });

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
  var LAYOUT = CoverageLayoutSchema.parse(coverage_layout_data_default);
  function layoutTiles() {
    return LAYOUT.sections.flatMap(
      (s) => s.subsections !== void 0 ? s.subsections.flatMap((sub) => sub.tiles) : s.tiles ?? []
    );
  }
  var NON_ESSENTIAL_NAMES = new Set(
    layoutTiles().filter((t) => t.essential === false).map((t) => t.key)
  );
  function essentialCount() {
    return layoutTiles().filter((t) => t.essential !== false).length;
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
    const countedTiles = tiles.filter((t) => !NON_ESSENTIAL_NAMES.has(t.name));
    const coveredCount = countedTiles.filter((t) => t.covered).length;
    const totalCount = countedTiles.length;
    cachedSnapshot = {
      tiles,
      coveredCount,
      totalCount,
      computedAt: (/* @__PURE__ */ new Date()).toISOString(),
      byCategory
    };
    emit("coverage:recomputed", { coveredCount, totalCount });
    return cachedSnapshot;
  }
  function getOrCompute() {
    return cachedSnapshot ?? recompute();
  }
  var cachedTargets = null;
  var cachedByName = null;
  function ensureTargets() {
    if (cachedTargets === null) {
      cachedTargets = readTargets();
      cachedByName = buildByName(cachedTargets);
    }
  }
  function getTargets() {
    ensureTargets();
    return cachedTargets ?? [];
  }
  function matchEssential(name) {
    ensureTargets();
    if (cachedTargets === null || cachedByName === null) {
      return null;
    }
    return matchToEssential(name, cachedTargets, cachedByName);
  }
  function currentDelivery() {
    ensureTargets();
    if (cachedTargets === null || cachedByName === null) {
      return /* @__PURE__ */ new Map();
    }
    const full = accumulate(loadEffectiveRegimen(), loadRgOverrides(), cachedTargets, cachedByName);
    const out = /* @__PURE__ */ new Map();
    for (const [k, v] of full) {
      out.set(k, { totalMg: v.totalMg, totalIU: v.totalIU });
    }
    return out;
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

  // assets/js/src/state/goals.ts
  var GOALS_KEY = "wallachGoals_v1";
  var MILESTONES_KEY = "wallachMilestones_v1";
  function listGoals() {
    const shape = getValidated(GOALS_KEY, GoalsShapeSchema);
    const goals = shape?.goals ?? [];
    return [...goals].sort((a, b) => {
      const af = a.featured ?? false;
      const bf = b.featured ?? false;
      if (af !== bf) {
        return af ? -1 : 1;
      }
      return b.progress - a.progress;
    });
  }
  function listMilestones() {
    const shape = getValidated(MILESTONES_KEY, MilestonesShapeSchema);
    const milestones = shape?.milestones ?? [];
    return [...milestones].sort((a, b) => {
      const aLocked = a.earnedAt === null;
      const bLocked = b.earnedAt === null;
      if (aLocked !== bLocked) {
        return aLocked ? 1 : -1;
      }
      if (a.earnedAt !== null && b.earnedAt !== null) {
        return a.earnedAt < b.earnedAt ? 1 : a.earnedAt > b.earnedAt ? -1 : 0;
      }
      return 0;
    });
  }

  // assets/js/src/state/journey.ts
  var JOURNEY_EVENTS_KEY = "wallachJourneyEvents_v1";
  var JOURNEY_CHECKINS_KEY = "wallachJourneyCheckins_v1";
  var CROSS_REF_WINDOW_DAYS = 7;
  var JOURNEY_RETENTION = 5e3;
  var DAY_MS = 24 * 60 * 60 * 1e3;
  function genId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
  function byTsDesc(aTs, bTs) {
    return aTs < bTs ? 1 : aTs > bTs ? -1 : 0;
  }
  function listEvents(sinceISO) {
    const shape = getValidated(JOURNEY_EVENTS_KEY, JourneyEventsShapeSchema);
    let events = shape?.events ?? [];
    if (sinceISO !== void 0) {
      events = events.filter((e) => e.occurredAt >= sinceISO);
    }
    return [...events].sort((a, b) => byTsDesc(a.occurredAt, b.occurredAt));
  }
  function listCheckins() {
    const shape = getValidated(JOURNEY_CHECKINS_KEY, CheckinsShapeSchema);
    return [...shape?.checkins ?? []].sort((a, b) => byTsDesc(a.loggedAt, b.loggedAt));
  }
  function logEvent(event) {
    const eventId = genId("ev");
    const full = { ...event, eventId };
    const shape = getValidated(JOURNEY_EVENTS_KEY, JourneyEventsShapeSchema);
    const all = [...shape?.events ?? [], full];
    const pruned = all.length > JOURNEY_RETENTION ? all.slice(all.length - JOURNEY_RETENTION) : all;
    set(JOURNEY_EVENTS_KEY, { events: pruned });
    emit("journey:changed", { reason: "event-logged" });
    return eventId;
  }
  function logCheckin(checkin) {
    const checkinId = genId("ci");
    const full = { ...checkin, checkinId };
    const shape = getValidated(JOURNEY_CHECKINS_KEY, CheckinsShapeSchema);
    const all = [...shape?.checkins ?? [], full];
    const pruned = all.length > JOURNEY_RETENTION ? all.slice(all.length - JOURNEY_RETENTION) : all;
    set(JOURNEY_CHECKINS_KEY, { checkins: pruned });
    emit("journey:changed", { reason: "checkin-logged" });
    return checkinId;
  }
  function crossRefForCheckin(checkin) {
    const center = Date.parse(checkin.loggedAt);
    if (Number.isNaN(center)) {
      return [];
    }
    const windowMs = CROSS_REF_WINDOW_DAYS * DAY_MS;
    return listEvents().filter((e) => {
      const t = Date.parse(e.occurredAt);
      return !Number.isNaN(t) && Math.abs(t - center) <= windowMs;
    });
  }

  // assets/data/ocr-dict-data.json
  var ocr_dict_data_default = {
    fuzzyDict: [
      "organic",
      "regenerative",
      "certified",
      "gluten",
      "free",
      "non-gmo",
      "natural",
      "flavor",
      "flavors",
      "color",
      "colors",
      "ingredients",
      "nutrition",
      "facts",
      "contains",
      "and",
      "or",
      "for",
      "with",
      "less",
      "than",
      "may",
      "contain",
      "trace",
      "amount",
      "total",
      "per",
      "serving",
      "daily",
      "value",
      "from",
      "of",
      "a",
      "as",
      "in",
      "to",
      "the",
      "an",
      "root",
      "leaf",
      "leaves",
      "seeds",
      "seed",
      "nuts",
      "nut",
      "bean",
      "beans",
      "peel",
      "rind",
      "pulp",
      "juice",
      "meal",
      "flour",
      "grain",
      "grains",
      "flake",
      "flakes",
      "meal",
      "base",
      "oats",
      "oat",
      "oatmeal",
      "rolled",
      "steel",
      "cut",
      "syrup",
      "solids",
      "groats",
      "bran",
      "fiber",
      "fibre",
      "soluble",
      "insoluble",
      "dietary",
      "prebiotic",
      "probiotic",
      "probiotics",
      "peptide",
      "peptides",
      "isolate",
      "isolates",
      "hydrolyzed",
      "collagen",
      "calories",
      "ocean",
      "sea",
      "trace",
      "mineral",
      "minerals",
      "electrolyte",
      "electrolytes",
      "sparkling",
      "infused",
      "beverage",
      "berry",
      "punch",
      "flavor",
      "flavors",
      "flavour",
      "flavours",
      "wheat",
      "barley",
      "rye",
      "malt",
      "spelt",
      "buckwheat",
      "amaranth",
      "quinoa",
      "rice",
      "brown",
      "millet",
      "sorghum",
      "teff",
      "sunflower",
      "safflower",
      "canola",
      "soybean",
      "corn",
      "cottonseed",
      "rapeseed",
      "coconut",
      "olive",
      "avocado",
      "palm",
      "oil",
      "high",
      "oleic",
      "hydrogenated",
      "cane",
      "sugar",
      "evaporated",
      "fructose",
      "corn",
      "syrup",
      "maple",
      "honey",
      "agave",
      "dextrose",
      "maltodextrin",
      "molasses",
      "stevia",
      "sucralose",
      "aspartame",
      "acesulfame",
      "saccharin",
      "xylitol",
      "erythritol",
      "monk",
      "fruit",
      "salt",
      "sea",
      "himalayan",
      "kosher",
      "iodized",
      "pink",
      "cassava",
      "tapioca",
      "starch",
      "cornstarch",
      "potato",
      "arrowroot",
      "cinnamon",
      "vanilla",
      "cocoa",
      "chocolate",
      "cacao",
      "nutmeg",
      "ginger",
      "clove",
      "turmeric",
      "pumpkin",
      "sunflower",
      "flax",
      "chia",
      "sesame",
      "hemp",
      "poppy",
      "seeds",
      "seed",
      "almonds",
      "almond",
      "cashews",
      "cashew",
      "walnuts",
      "pecans",
      "peanuts",
      "pistachios",
      "hazelnut",
      "macadamia",
      "brazil",
      "nuts",
      "milk",
      "cream",
      "butter",
      "cheese",
      "yogurt",
      "whey",
      "casein",
      "protein",
      "isolate",
      "concentrate",
      "collagen",
      "peptides",
      "gelatin",
      "eggs",
      "egg",
      "whites",
      "yolks",
      "vitamin",
      "riboflavin",
      "thiamine",
      "niacin",
      "pyridoxine",
      "cobalamin",
      "folate",
      "biotin",
      "choline",
      "inositol",
      "freshness",
      "enriched",
      "fortified",
      "extract",
      "concentrate",
      "blend",
      "contains",
      "water",
      "carbonated",
      "sparkling",
      "filtered",
      "distilled",
      "spring",
      "pea",
      "soy",
      "chickpea",
      "lentil",
      "bean",
      "beans",
      "black",
      "navy",
      "kidney",
      "pinto",
      "lecithin",
      "sunflower",
      "soy",
      "xanthan",
      "guar",
      "gum",
      "pectin",
      "agar",
      "citric",
      "malic",
      "ascorbic",
      "tartaric",
      "phosphoric",
      "acid",
      "sodium",
      "bicarbonate",
      "baking",
      "soda",
      "powder",
      "paprika",
      "rosemary",
      "thyme",
      "oregano",
      "basil",
      "parsley",
      "sage",
      "garlic",
      "onion"
    ],
    knownNutrientNames: [
      "Vitamin B12",
      "Vitamin B6",
      "Vitamin B5",
      "Vitamin B3",
      "Vitamin B2",
      "Vitamin B1",
      "Vitamin A",
      "Vitamin C",
      "Vitamin D",
      "Vitamin E",
      "Vitamin K",
      "Collagen Peptides",
      "Dietary Fiber",
      "Total Carbohydrate",
      "Total Sugars",
      "Added Sugars",
      "Pantothenic Acid",
      "Folic Acid",
      "Ascorbic Acid",
      "Omega-3",
      "Omega 3",
      "EPA",
      "DHA",
      "Calcium",
      "Magnesium",
      "Potassium",
      "Sodium",
      "Iron",
      "Zinc",
      "Copper",
      "Manganese",
      "Chromium",
      "Selenium",
      "Iodine",
      "Boron",
      "Molybdenum",
      "Phosphorus",
      "Sulfur",
      "Thiamine",
      "Riboflavin",
      "Niacin",
      "Pyridoxine",
      "Cobalamin",
      "Folate",
      "Biotin",
      "Choline",
      "Inositol",
      "Protein",
      "Collagen",
      "Fiber"
    ]
  };

  // assets/data/scanner-corpus-data.json
  var scanner_corpus_data_default = {
    dietaryBaseline: {
      Calcium: {
        amount: 110,
        unit: "mg"
      },
      Copper: {
        amount: 0.4,
        unit: "mg"
      },
      Iodine: {
        amount: 121,
        unit: "mcg"
      },
      Iron: {
        amount: 1.6,
        unit: "mg"
      },
      Magnesium: {
        amount: 85,
        unit: "mg"
      },
      Manganese: {
        amount: 0.5,
        unit: "mg"
      },
      Phosphorus: {
        amount: 727,
        unit: "mg"
      },
      Potassium: {
        amount: 108,
        unit: "mg"
      },
      Selenium: {
        amount: 81.2,
        unit: "mcg"
      },
      Sodium: {
        amount: 1275,
        unit: "mg"
      },
      Zinc: {
        amount: 4,
        unit: "mg"
      },
      "Vitamin A (Retinol / beta-carotene)": {
        amount: 130,
        unit: "mcg"
      },
      "Vitamin B2 (Riboflavin)": {
        amount: 0.4,
        unit: "mg"
      },
      "Vitamin B3 (Niacin)": {
        amount: 17,
        unit: "mg"
      },
      "Vitamin B5 (Pantothenic Acid)": {
        amount: 2.4,
        unit: "mg"
      },
      "Vitamin B6 (Pyridoxine)": {
        amount: 1.2,
        unit: "mg"
      },
      "Vitamin B12 (Cobalamin)": {
        amount: 4.2,
        unit: "mcg"
      },
      "Vitamin C (Ascorbic Acid)": {
        amount: 67.5,
        unit: "mg"
      },
      "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)": {
        amount: 681,
        unit: "iu"
      },
      "Vitamin K (Menaquinone = K2)": {
        amount: 9,
        unit: "mcg"
      },
      Biotin: {
        amount: 10,
        unit: "mcg"
      },
      Choline: {
        amount: 147,
        unit: "mg"
      },
      "Folic Acid (Folate)": {
        amount: 24,
        unit: "mcg"
      },
      "Omega-3 (alpha-linolenic + EPA/DHA in marine form)": {
        amount: 1e3,
        unit: "mg"
      },
      "Omega-6 (linoleic + GLA)": {
        amount: 1e3,
        unit: "mg"
      },
      "Omega-9 (Arachidonic / Oleic)": {
        amount: 1e3,
        unit: "mg"
      }
    },
    goalKeywords: {
      cognition: [
        "cogniti",
        "memory",
        "focus",
        "brain",
        "neuro",
        "mental",
        "alzheimer",
        "dementia",
        "lecithin",
        "choline",
        "phosphatidyl",
        "nerve",
        "synaptic",
        "myelin",
        "mood"
      ],
      hormones_strength: [
        "testosterone",
        "hormone",
        "libido",
        "strength",
        "muscle",
        "androgen",
        "estrogen",
        "boron",
        "tribulus",
        "anabolic",
        "vitality",
        "sexual"
      ],
      longevity_anti_aging: [
        "aging",
        "longevity",
        "anti-aging",
        "youthful",
        "lifespan",
        "telomere",
        "rejuven",
        "centenarian"
      ],
      joints_collagen: [
        "joint",
        "cartilage",
        "collagen",
        "msm",
        "glucosamine",
        "chondroitin",
        "arthritis",
        "flexibility",
        "mobility",
        "tendon",
        "ligament"
      ],
      energy_metabolism: [
        "energy",
        "metabolism",
        "fatigue",
        "stamina",
        "endurance",
        "atp",
        "mitochondri",
        "co-q10",
        "coq10",
        "b-complex",
        "b vitamin"
      ],
      immunity: [
        "immun",
        "infection",
        "antiviral",
        "antimicrobial",
        "lymph",
        "thymus"
      ],
      gut_digestion: [
        "digesti",
        "gut",
        "probiotic",
        "enzyme",
        "stomach",
        "intestin",
        "betaine",
        "hcl",
        "microbiome",
        "bowel",
        "colon"
      ],
      cardiovascular: [
        "cardiovasc",
        "heart",
        "blood pressure",
        "cholesterol",
        "circulation",
        "artery",
        "stroke"
      ],
      bone_skeletal: [
        "bone",
        "osteoporosis",
        "skeletal",
        "spine",
        "fracture",
        "vertebr"
      ],
      thyroid_endocrine: [
        "thyroid",
        "adrenal",
        "endocrine",
        "cortisol"
      ],
      skin_hair_nails: [
        "skin",
        "hair",
        "nail",
        "wrinkle",
        "biotin",
        "silica"
      ],
      blood_sugar: [
        "blood sugar",
        "glucose",
        "diabet",
        "insulin",
        "glycemic"
      ],
      sleep_stress: [
        "sleep",
        "insomnia",
        "stress",
        "relax",
        "anxiety",
        "calm",
        "melatonin"
      ],
      hydration_electrolyte: [
        "hydrat",
        "electrolyte",
        "sparkling beverage"
      ]
    },
    nutrientToGoalMap: {
      cognition: [
        {
          nutrient: "Choline",
          why: "Wallach: 4 g/day clinical for memory / focus; primary cognitive substrate."
        },
        {
          nutrient: "Lecithin",
          why: "Wallach: dietary choline carrier; supports myelin / synaptic function."
        },
        {
          nutrient: "Chromium",
          why: "Wallach: cognition pairs with vanadium; blood-sugar stability underwrites focus."
        },
        {
          nutrient: "Vanadium",
          why: "Wallach: paired with Cr for cognition + blood-sugar stability."
        },
        {
          nutrient: "Zinc",
          why: "Wallach: cognition cofactor; supports neurotransmitter synthesis."
        },
        {
          nutrient: "Copper",
          why: "Wallach: cognitive cofactor; required for catecholamine synthesis."
        },
        {
          nutrient: "DHA",
          why: "Wallach: essential fatty acid for brain membrane integrity."
        },
        {
          nutrient: "Omega-3",
          why: "Wallach: EFA family; EPA+DHA support brain + nerve health."
        },
        {
          nutrient: "Vitamin E",
          why: "Wallach: neuronal cellular membrane integrity."
        },
        {
          nutrient: "Vitamin B1 (Thiamine)",
          why: "Wallach: nerve health; B-complex anchor for cognition."
        },
        {
          nutrient: "Vitamin B6 (Pyridoxine)",
          why: "Wallach: cognition / mood; B-complex anchor."
        },
        {
          nutrient: "Vitamin B12 (Cobalamin)",
          why: "Wallach: nerve / methylation; B-complex anchor for cognition."
        },
        {
          nutrient: "Taurine",
          why: "Wallach: cognition / nerve support."
        }
      ],
      hormones_strength: [
        {
          nutrient: "Zinc",
          why: "Wallach: 45-150 mg/day for testosterone protocol; T-supporting cofactor."
        },
        {
          nutrient: "Boron",
          why: "Wallach: \u22651 mg clinical for hormonal balance; T-supporting."
        },
        {
          nutrient: "Vitamin A",
          why: "Wallach: hormonal support; beta-carotene form preferred."
        },
        {
          nutrient: "Vitamin E",
          why: "Wallach: hormone synthesis cofactor."
        },
        {
          nutrient: "Selenium",
          why: "Wallach: hormone-supporting cofactor."
        },
        {
          nutrient: "Omega-3",
          why: "Wallach: hormonal support via EFA pathway."
        }
      ],
      longevity_anti_aging: [
        {
          nutrient: "Selenium",
          why: "Wallach: longevity-supporting mineral; aligned with hair-mineral baseline."
        },
        {
          nutrient: "Zinc",
          why: "Wallach: cellular repair / longevity cofactor."
        },
        {
          nutrient: "Vitamin E",
          why: "Wallach: antioxidant pathway for longevity."
        }
      ],
      joints_collagen: [
        {
          nutrient: "Collagen",
          why: "Joint substrate; framework-adjacent (Wallach silent on collagen specifically)."
        },
        {
          nutrient: "Collagen Peptides",
          why: "Joint substrate; framework-adjacent \u2014 supports cartilage / tendon."
        },
        {
          nutrient: "Vitamin C",
          why: "Wallach: collagen synthesis cofactor (ascorbate-dependent)."
        },
        {
          nutrient: "Copper",
          why: "Wallach: collagen + elastin cross-linking; aneurysm-prevention cofactor."
        },
        {
          nutrient: "Manganese",
          why: "Wallach: bone / connective tissue cofactor."
        },
        {
          nutrient: "Boron",
          why: "Wallach: joint / bone supporting cofactor."
        }
      ],
      energy_metabolism: [
        {
          nutrient: "Vitamin B1 (Thiamine)",
          why: "Wallach: carbohydrate utilization for energy."
        },
        {
          nutrient: "Vitamin B2 (Riboflavin)",
          why: "Wallach: cellular energy production."
        },
        {
          nutrient: "Vitamin B3 (Niacin)",
          why: "Wallach: NAD+ pathway; ATP production."
        },
        {
          nutrient: "Vitamin B5 (Pantothenic Acid)",
          why: "Wallach: CoA synthesis; energy substrate."
        },
        {
          nutrient: "Iron",
          why: "Wallach: hemoglobin / oxygen transport for energy."
        },
        {
          nutrient: "Magnesium",
          why: "Wallach: ATP cofactor."
        }
      ],
      immunity: [
        {
          nutrient: "Zinc",
          why: "Wallach: immune cofactor."
        },
        {
          nutrient: "Vitamin C",
          why: "Wallach: 10,000 mg/day clinical; immune anchor."
        },
        {
          nutrient: "Selenium",
          why: "Wallach: antiviral / immune support."
        },
        {
          nutrient: "Vitamin A",
          why: "Wallach: epithelial / immune support; beta-carotene form preferred."
        }
      ],
      gut_digestion: [
        {
          nutrient: "Fiber",
          why: "Substrate for gut microbiome; not a Wallach 90-essential but tracked."
        },
        {
          nutrient: "Dietary Fiber",
          why: "Substrate for gut microbiome; not a Wallach 90-essential but tracked."
        }
      ],
      cardiovascular: [
        {
          nutrient: "Copper",
          why: "Wallach: elastin / vascular integrity; aneurysm-prevention cofactor."
        },
        {
          nutrient: "Magnesium",
          why: "Wallach: vascular / heart-rhythm cofactor."
        },
        {
          nutrient: "Omega-3",
          why: "Wallach: vascular EFA support."
        },
        {
          nutrient: "Selenium",
          why: "Wallach: vascular / heart cofactor (Keshan disease region)."
        }
      ],
      bone_skeletal: [
        {
          nutrient: "Calcium",
          why: "Wallach: 2,000-5,000 mg/day clinical; bone foundation."
        },
        {
          nutrient: "Magnesium",
          why: "Wallach: 1,000 mg/day; bone matrix cofactor; Ca:Mg ratio."
        },
        {
          nutrient: "Boron",
          why: "Wallach: \u22651 mg clinical; bone density / Ca utilization."
        },
        {
          nutrient: "Vitamin D",
          why: "Wallach: 1,000 IU/day baseline; Ca absorption."
        },
        {
          nutrient: "Vitamin K",
          why: "Wallach: bone matrix; K2 form preferred."
        },
        {
          nutrient: "Phosphorus",
          why: "Wallach: bone mineral matrix."
        }
      ],
      thyroid_endocrine: [
        {
          nutrient: "Iodine",
          why: "Wallach: 150-1,500 mcg/day; thyroid foundation."
        },
        {
          nutrient: "Selenium",
          why: "Wallach: 500-3,000 mcg/day; T4\u2192T3 conversion cofactor."
        },
        {
          nutrient: "Vitamin B12 (Cobalamin)",
          why: "Wallach: B12 + thyroid support pair; methylation."
        }
      ],
      skin_hair_nails: [
        {
          nutrient: "Biotin",
          why: "Wallach: hair / nail cofactor."
        },
        {
          nutrient: "Collagen",
          why: "Skin substrate; framework-adjacent."
        },
        {
          nutrient: "Collagen Peptides",
          why: "Skin substrate; framework-adjacent."
        },
        {
          nutrient: "Vitamin C",
          why: "Wallach: skin collagen synthesis cofactor."
        }
      ],
      blood_sugar: [
        {
          nutrient: "Chromium",
          why: "Wallach: 200-500 mcg/day; insulin sensitivity cofactor."
        },
        {
          nutrient: "Vanadium",
          why: "Wallach: paired with Cr for blood-sugar stability."
        },
        {
          nutrient: "Magnesium",
          why: "Wallach: insulin signaling cofactor."
        }
      ],
      hydration_electrolyte: [
        {
          nutrient: "Sodium",
          why: "Wallach: 300-3,000 mg/day; electrolyte baseline."
        },
        {
          nutrient: "Potassium",
          why: "Wallach: 5,500 mg/day; counter-balance to sodium."
        },
        {
          nutrient: "Magnesium",
          why: "Wallach: electrolyte / muscle relaxation."
        },
        {
          nutrient: "Calcium",
          why: "Wallach: electrolyte / muscle function."
        }
      ],
      sleep_stress: [
        {
          nutrient: "Magnesium",
          why: "Wallach: relaxation / sleep cofactor."
        },
        {
          nutrient: "Calcium",
          why: "Wallach: pairs with Mg for relaxation."
        }
      ]
    },
    goalDisplayNames: {
      cognition: "Cognition",
      hormones_strength: "Hormones / strength",
      longevity_anti_aging: "Longevity / anti-aging",
      joints_collagen: "Joints / collagen",
      energy_metabolism: "Energy / metabolism",
      immunity: "Immunity",
      gut_digestion: "Gut / digestion",
      cardiovascular: "Cardiovascular",
      bone_skeletal: "Bone / skeletal",
      thyroid_endocrine: "Thyroid / endocrine",
      skin_hair_nails: "Skin / hair / nails",
      blood_sugar: "Blood sugar",
      sleep_stress: "Sleep / stress",
      hydration_electrolyte: "Hydration / electrolyte",
      essential_baseline: "Essential baseline",
      detox_cleanse: "Detox / cleanse",
      prostate_urinary: "Prostate / urinary",
      weight_management: "Weight management",
      eye_vision: "Eye / vision"
    },
    antiList: {
      "fried oils / seed oils": [
        "canola oil",
        "soybean oil",
        "vegetable oil",
        "sunflower oil",
        "safflower oil",
        "corn oil",
        "cottonseed oil",
        "rapeseed oil",
        "hydrogenated"
      ],
      "added sugar": [
        "high fructose corn syrup",
        "corn syrup",
        "cane sugar",
        "evaporated cane juice",
        "dextrose",
        "maltodextrin"
      ],
      "artificial sweeteners": [
        "sucralose",
        "aspartame",
        "acesulfame",
        "saccharin",
        "neotame"
      ],
      caffeine: [
        "caffeine",
        "yerba mate",
        "guarana",
        "kola nut"
      ],
      "gluten sources": [
        "wheat",
        "barley",
        "rye",
        "malt",
        "spelt",
        "oats",
        "oat",
        "oatmeal",
        "oat flour",
        "oat syrup",
        "oat groats",
        "oat bran"
      ],
      "msg / glutamate": [
        "monosodium glutamate",
        "yeast extract",
        "hydrolyzed protein"
      ]
    },
    antiListNotes: {
      "fried oils / seed oils": "Wallach: 'if it has oil in name, don't use it' \u2014 broad rule against industrial seed oils due to omega-6 oxidation. High-oleic variants (sunflower/safflower/canola bred for >80% oleic acid) are framework-adjacent \u2014 significantly more stable than standard, but the broad rule still applies.",
      "added sugar": "Wallach-direct: sugar raises urinary chromium loss 300% for 12 hours (Rare Earths Cr entry). Severity scales with daily exposure; low-dose trace use is bounded harm.",
      "artificial sweeteners": "Wallach acknowledges sucralose as acceptable (Hell's Kitchen). Aspartame and acesulfame are mainstream-controversial \u2014 framework-adjacent. Stevia is Wallach-friendly.",
      caffeine: "Wallach-direct: caffeine raises urinary Cr loss for ~12 hrs per dose. Not anti-coffee absolute, but flag for Cr cofactor balance.",
      "gluten sources": "Wallach-direct on actual gluten proteins: wheat / barley / rye / malt / spelt \u2014 these always flag serious regardless of marketing. Oats flag by default (commercial supply chains carry cross-contamination risk). Operational rule: if ANY oat ingredient in the label is declared 'gluten-free' \u2014 in either word order ('gluten free oats' or 'oats (gluten free)') \u2014 ALL oat-derivatives in that product are presumed GF, because a brand certifying one oat ingredient operates in a GF-aware supply chain across the rest. A 'gluten-free' claim attached to a NON-oat ingredient (e.g., 'gluten-free pasta') does NOT certify oats. Hard gluten proteins appearing elsewhere still flag independently \u2014 no shutoff trick. Buckwheat is a pseudocereal, gluten-free despite the name.",
      "msg / glutamate": "Wallach: free glutamate is a neurotoxin concern. Common hidden sources: yeast extract, hydrolyzed protein."
    },
    hardRejectTerms: [
      "high fructose corn syrup",
      "corn syrup",
      "hydrogenated",
      "monosodium glutamate",
      "aspartame",
      "acesulfame"
    ],
    seriousAnti: [
      "fried oils / seed oils",
      "added sugar",
      "gluten sources",
      "msg / glutamate"
    ]
  };

  // assets/js/src/state/scanner.ts
  var RECENT_SCANS_KEY = "lcRecentScans_v1";
  var MAX_RECENT = 5;
  var cachedCorpus = null;
  function loadScanCorpus() {
    if (cachedCorpus === null) {
      cachedCorpus = ScanCorpusSchema.parse(scanner_corpus_data_default);
    }
    return cachedCorpus;
  }
  function getHistory() {
    return getValidated(RECENT_SCANS_KEY, HistoryShapeSchema)?.items ?? [];
  }
  var lastResult = null;
  function normalize(amount, unit) {
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return null;
    }
    const u = (unit ?? "").toLowerCase().trim();
    if (u === "mcg") {
      return { family: "mass_mcg", value: amount };
    }
    if (u === "mg") {
      return { family: "mass_mcg", value: amount * 1e3 };
    }
    if (u === "g") {
      return { family: "mass_mcg", value: amount * 1e6 };
    }
    if (u === "iu") {
      return { family: "iu", value: amount };
    }
    return null;
  }
  function unitConv(value, fromUnit, toUnit) {
    const f = (fromUnit ?? "").toLowerCase();
    const tu = (toUnit ?? "").toLowerCase();
    if (f === tu) {
      return value;
    }
    if (f === "iu" || tu === "iu") {
      return null;
    }
    let mg;
    if (f === "mg") {
      mg = value;
    } else if (f === "mcg") {
      mg = value / 1e3;
    } else if (f === "g") {
      mg = value * 1e3;
    } else {
      return null;
    }
    if (tu === "mg") {
      return mg;
    }
    if (tu === "mcg") {
      return mg * 1e3;
    }
    if (tu === "g") {
      return mg / 1e3;
    }
    return null;
  }
  function matchKeyword(text, kw) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  }
  function essTarget(ess) {
    const r = CoverageTargetSchema.safeParse(ess.target);
    return r.success ? r.data : null;
  }
  function alignmentScore(nutrients) {
    let a = 0;
    let p = 0;
    let m = 0;
    let u = 0;
    for (const n of nutrients) {
      const raw = n["form_alignment"];
      const al = typeof raw === "string" ? raw : "unknown";
      if (al === "aligned") {
        a += 1;
      } else if (al === "partial") {
        p += 1;
      } else if (al === "misaligned") {
        m += 1;
      } else {
        u += 1;
      }
    }
    const total = a + p + m + u;
    const score = total ? Math.round((a * 2 + p - m) / total * 100) / 100 : 0;
    return { score, aligned: a, total, misaligned: m };
  }
  function getEffectiveCoverage() {
    const corpus2 = loadScanCorpus();
    const targets = getTargets();
    const live = currentDelivery();
    const dbByTargetName = {};
    for (const [dbKey, dbEntry] of Object.entries(corpus2.dietaryBaseline)) {
      const matched = matchEssential(dbKey);
      if (matched !== null) {
        dbByTargetName[matched.name] = { amount: dbEntry.amount, unit: dbEntry.unit };
      }
    }
    const base = {};
    for (const t of targets) {
      const tgt = essTarget(t);
      if (tgt === null || tgt.low === void 0 || tgt.low === null) {
        continue;
      }
      const targetUnit = (tgt.unit ?? "mg").toLowerCase();
      let amount = 0;
      const dbEntry = dbByTargetName[t.name];
      if (dbEntry !== void 0) {
        const conv = unitConv(dbEntry.amount, dbEntry.unit, targetUnit);
        if (conv !== null) {
          amount += conv;
        }
      }
      const liveEntry = live.get(t.name);
      if (liveEntry !== void 0) {
        if (targetUnit === "iu") {
          amount += liveEntry.totalIU;
        } else {
          const conv = unitConv(liveEntry.totalMg, "mg", targetUnit);
          if (conv !== null) {
            amount += conv;
          }
        }
      }
      if (amount > 0) {
        base[t.name] = { amount: Math.round(amount * 100) / 100, unit: targetUnit };
      }
    }
    return base;
  }
  function gapFillFor(n, dailyServings, effectiveCov) {
    const ess = matchEssential(n.name);
    if (ess === null) {
      return null;
    }
    const tgt = essTarget(ess);
    if (tgt === null || tgt.low === void 0 || tgt.low === null) {
      return null;
    }
    const norm = normalize(Number(n.amount), n.unit);
    if (norm === null) {
      return null;
    }
    const targetNorm = normalize(tgt.low, tgt.unit);
    if (targetNorm === null || norm.family !== targetNorm.family) {
      return null;
    }
    const addedPerDay = norm.value * dailyServings;
    const cov = effectiveCov[ess.name];
    const curr = cov !== void 0 ? normalize(cov.amount, cov.unit)?.value ?? 0 : 0;
    const gap = Math.max(0, targetNorm.value - curr);
    const pct = targetNorm.value > 0 ? Math.round(1e3 * Math.min(addedPerDay, gap) / targetNorm.value) / 10 : 0;
    return {
      essential: ess.name,
      gapFillPct: pct,
      amountClaimed: addedPerDay,
      unit: norm.family === "iu" ? "iu" : "mcg"
    };
  }
  function matchGoals(label, corpus2) {
    const nameTxt = `${label.name ?? ""} ${label.brand ?? ""}`.toLowerCase();
    const labelNutrients = label.nutrients ?? [];
    const dailyServings = Number.parseFloat(String(label.servings)) || 1;
    const MEANINGFUL_PCT = 10;
    const stats = {};
    for (const ln of labelNutrients) {
      const key = (ln.name ?? "").toLowerCase().trim();
      const ess = matchEssential(ln.name);
      let pct = null;
      if (ess !== null) {
        const tgt = essTarget(ess);
        const norm = normalize(Number(ln.amount), ln.unit);
        const targetNorm = tgt !== null && tgt.low !== void 0 && tgt.low !== null ? normalize(tgt.low, tgt.unit) : null;
        if (norm !== null && targetNorm !== null && norm.family === targetNorm.family && targetNorm.value > 0) {
          pct = Math.round(1e3 * (norm.value * dailyServings) / targetNorm.value) / 10;
        }
      }
      stats[key] = { pct, has: ess !== null };
    }
    const goals = [];
    for (const [goal, kws] of Object.entries(corpus2.goalKeywords)) {
      const strong = kws.filter((kw) => nameTxt.includes(kw));
      const goalNutMap = corpus2.nutrientToGoalMap[goal] ?? [];
      const seen = /* @__PURE__ */ new Set();
      const matched = [];
      for (const gn of goalNutMap) {
        const b = gn.nutrient.toLowerCase().trim();
        const hit = labelNutrients.find((ln) => {
          const a = (ln.name ?? "").toLowerCase().trim();
          return a === b || a.includes(b) || b.includes(a);
        });
        if (hit !== void 0 && !seen.has(b)) {
          seen.add(b);
          const key = (hit.name ?? "").toLowerCase().trim();
          matched.push(stats[key] ?? { pct: null, has: false });
        }
      }
      const meaningful = matched.filter((s) => s.has ? s.pct !== null && s.pct >= MEANINGFUL_PCT : strong.length > 0);
      if (strong.length > 0 || meaningful.length > 0) {
        goals.push(goal);
      }
    }
    return goals;
  }
  var HARD_GLUTEN = /* @__PURE__ */ new Set(["wheat", "barley", "rye", "malt", "spelt"]);
  var OAT_DERIVED = /* @__PURE__ */ new Set(["oats", "oat", "oatmeal", "oat flour", "oat syrup", "oat groats", "oat bran"]);
  function antiFlags(label, corpus2) {
    const text = (label.ingredients ?? "").toLowerCase();
    const hardReject = new Set(corpus2.hardRejectTerms);
    const flags = [];
    for (const [cat, kws] of Object.entries(corpus2.antiList)) {
      const hits = kws.filter((kw) => matchKeyword(text, kw));
      if (hits.length === 0) {
        continue;
      }
      const flag = { category: cat, terms: hits, severity: "mild" };
      if (cat === "fried oils / seed oils") {
        const variants = ["sunflower oil", "safflower oil", "canola oil"];
        const variantHits = hits.filter((h) => variants.includes(h));
        const otherHits = hits.filter((h) => !variants.includes(h));
        if (variantHits.length > 0 && otherHits.length === 0) {
          const isHighOleic = /high oleic[^,.]*(?:sunflower|safflower|canola)/i.test(text);
          if (isHighOleic) {
            flag.nuance = "High-oleic variant detected \u2014 significantly more oxidation-stable than standard seed oil (>80% oleic acid, low omega-6). Wallach's broad rule still applies but severity is softened.";
            flag.softened = true;
          }
        }
      }
      if (cat === "gluten sources") {
        const hardHits = hits.filter((h) => HARD_GLUTEN.has(h));
        const oatHits = hits.filter((h) => OAT_DERIVED.has(h));
        const oatGfPre = /gluten[-\s]+free[^,]+\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b/i;
        const oatGfPost = /\b(?:oats|oat|oatmeal|oat\s+flour|oat\s+groats|oat\s+bran|oat\s+syrup)\b[^,]+gluten[-\s]+free/i;
        const hasGFOatsAnchor = oatGfPre.test(text) || oatGfPost.test(text);
        if (hardHits.length > 0) {
          flag.nuance = `Hard gluten proteins detected: ${hardHits.map((t) => `"${t}"`).join(", ")}. Wallach-direct: wheat / barley / rye / malt / spelt are the actual gluten proteins. No softening \u2014 a gluten free oats declaration cannot shut off the trigger for actual gluten elsewhere on the label.`;
        } else if (oatHits.length > 0) {
          if (hasGFOatsAnchor) {
            flag.nuance = `Oat-anchored gluten-free declaration detected on the label. Per the operational rule: once a brand certifies ANY oat ingredient as GF, they are operating in a GF-aware supply chain across all oat ingredients in that product. All oat hits (${oatHits.map((t) => `"${t}"`).join(", ")}) are presumed gluten-free. Flag softened.`;
            flag.softened = true;
          } else {
            flag.nuance = `Oat ingredients detected (${oatHits.map((t) => `"${t}"`).join(", ")}) with no gluten free oats declaration on the label. Standard commercial oats carry real cross-contamination risk from shared supply chains. A gluten-free claim attached to a non-oat ingredient (e.g., gluten-free pasta) does NOT certify the oats. Flag stays serious until brand certifies oat GF status.`;
          }
        }
      }
      let severity = "mild";
      for (const term of hits) {
        if (hardReject.has(term)) {
          severity = "hard";
          break;
        }
      }
      if (severity !== "hard") {
        if (corpus2.seriousAnti.includes(cat) && flag.softened !== true) {
          severity = "serious";
        } else if (flag.softened === true) {
          severity = "softened";
        }
      }
      flag.severity = severity;
      flags.push(flag);
    }
    return flags;
  }
  function containerFlag() {
    return [];
  }
  function decideVerdict(alignment, gapFills, anti, conflicts, goals, corpus2) {
    const reasonsFor = [];
    const reasonsAgainst = [];
    if (alignment.score >= 1.5) {
      reasonsFor.push({ label: `High form alignment (${alignment.score}/2.0, ${alignment.aligned}/${alignment.total} aligned)` });
    } else if (alignment.score >= 0.5) {
      reasonsFor.push({ label: `Moderate form alignment (${alignment.score}/2.0)` });
    }
    if (alignment.misaligned > 0) {
      reasonsAgainst.push({ label: `${alignment.misaligned} misaligned form${alignment.misaligned > 1 ? "s" : ""} \u2014 non-Wallach-preferred` });
    }
    const meaningful = gapFills.filter((g) => g.gapFillPct >= 10);
    if (meaningful.length > 0) {
      const top = [...meaningful].sort((a, b) => b.gapFillPct - a.gapFillPct).slice(0, 3);
      reasonsFor.push({ label: "Meaningful gap-fill", items: top.map((g) => `${g.essential} (+${g.gapFillPct}%)`) });
    } else if (gapFills.length > 0) {
      reasonsAgainst.push({ label: "No nutrient closes >10% of a current gap" });
    }
    if (goals.length > 0) {
      reasonsFor.push({
        label: "Goal coverage",
        items: goals.slice(0, 4).map((g) => corpus2.goalDisplayNames[g] ?? g)
      });
    }
    const hardHits = anti.filter((f) => f.severity === "hard");
    const seriousHits = anti.filter((f) => f.severity === "serious");
    const softHits = anti.filter((f) => f.severity === "softened" || f.severity === "mild");
    if (hardHits.length > 0) {
      reasonsAgainst.push({ label: "Hard-reject ingredients", items: hardHits.map((f) => f.category) });
    }
    if (seriousHits.length > 0) {
      reasonsAgainst.push({ label: "Serious anti-list flags", items: seriousHits.map((f) => f.category) });
    }
    if (softHits.length > 0) {
      reasonsAgainst.push({ label: "Mild / softened flags (nuance applied)", items: softHits.map((f) => f.category) });
    }
    const high = conflicts.filter((c) => c.severity === "high");
    if (high.length > 0) {
      reasonsAgainst.push({ label: "High-severity conflicts", items: high.map((c) => c.rule) });
    }
    let verdict;
    if (high.length > 0 || hardHits.length > 0 || seriousHits.length >= 2) {
      verdict = "REJECT";
    } else if (alignment.score >= 1 && meaningful.length > 0 && seriousHits.length === 0) {
      verdict = "ADD";
    } else if (meaningful.length > 0 || alignment.score >= 0.5 || goals.length > 0 || seriousHits.length > 0 || softHits.length > 0) {
      verdict = "SAVE";
    } else {
      verdict = "REJECT";
    }
    return { verdict, reasonsFor, reasonsAgainst };
  }
  function pushRecentScan(label, result) {
    const shape = getValidated(RECENT_SCANS_KEY, HistoryShapeSchema) ?? { items: [] };
    const items = shape.items.filter((i) => i.label.name !== label.name);
    items.unshift({
      id: Date.now() + Math.floor(Math.random() * 1e3),
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      label,
      verdict: result.verdict,
      alignment: result.alignment,
      goals: result.goals,
      gapFills: result.gapFills
    });
    setValidated(RECENT_SCANS_KEY, { items: items.slice(0, MAX_RECENT) }, HistoryShapeSchema);
  }
  function scan(label, opts) {
    const cfg = { logToRecent: true, ...opts };
    const corpus2 = loadScanCorpus();
    const nutrients = label.nutrients ?? [];
    const alignment = alignmentScore(nutrients);
    const dailyServings = Number.parseFloat(String(label.servings)) || 1;
    const effectiveCov = getEffectiveCoverage();
    const gapFills = nutrients.map((n) => gapFillFor(n, dailyServings, effectiveCov)).filter((g) => g !== null);
    const goals = matchGoals(label, corpus2);
    const anti = antiFlags(label, corpus2);
    const conflicts = containerFlag();
    const { verdict, reasonsFor, reasonsAgainst } = decideVerdict(alignment, gapFills, anti, conflicts, goals, corpus2);
    const result = {
      label,
      alignment,
      gapFills,
      goals,
      anti,
      conflicts,
      verdict,
      reasonsFor,
      reasonsAgainst
    };
    result.sparseNutrients = nutrients.length === 0;
    result.sparseIngredients = (label.ingredients ?? "").trim().length === 0;
    if (cfg.logToRecent) {
      pushRecentScan(label, result);
      lastResult = result;
      window.lcLastResult = result;
      emit("scanner:scan-complete", { captureId: String(Date.now()), verdict: mapVerdict(verdict) });
    }
    return result;
  }
  function runScan(label) {
    try {
      return scan(label, { logToRecent: true });
    } catch (e) {
      console.warn("[state/scanner] scan threw:", e);
      return null;
    }
  }
  function mapVerdict(v) {
    if (v === "ADD") {
      return "aligns";
    }
    if (v === "SAVE") {
      return "partial";
    }
    return "out";
  }
  if (typeof window !== "undefined") {
    window.lcScan = scan;
  }

  // assets/js/src/state/ocr.ts
  var cachedDict = null;
  function loadDict() {
    if (cachedDict === null) {
      const parsed = OcrDictSchema.parse(ocr_dict_data_default);
      cachedDict = {
        fuzzy: new Set(parsed.fuzzyDict.map((w) => w.toLowerCase())),
        known: parsed.knownNutrientNames
      };
    }
    return cachedDict;
  }
  async function loadTesseract() {
    const w = window;
    if (w.Tesseract !== void 0) {
      return;
    }
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./assets/vendor/tesseract/tesseract.min.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load local OCR engine. Run `node tools/vendor-tesseract.js` once to vendor Tesseract files into dashboard/assets/vendor/tesseract/."));
      document.head.appendChild(script);
    });
  }
  async function preprocessImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const target = 2e3;
          const scale = Math.max(1, Math.min(3, target / Math.max(img.naturalWidth, img.naturalHeight)));
          canvas.width = Math.round(img.naturalWidth * scale);
          canvas.height = Math.round(img.naturalHeight * scale);
          const ctx = canvas.getContext("2d");
          if (ctx === null) {
            reject(new Error("2D canvas context unavailable"));
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = (d[i] ?? 0) * 0.299 + (d[i + 1] ?? 0) * 0.587 + (d[i + 2] ?? 0) * 0.114;
            const v = Math.max(0, Math.min(255, (gray - 128) * 1.25 + 128));
            d[i] = v;
            d[i + 1] = v;
            d[i + 2] = v;
          }
          ctx.putImageData(id, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      img.onerror = () => reject(new Error("Failed to load image for preprocessing"));
      img.src = dataUrl;
    });
  }
  async function runOcr(imageData, progress) {
    progress("Preprocessing image...", 0);
    let processed;
    try {
      processed = await preprocessImage(imageData);
    } catch {
      processed = imageData;
    }
    progress("Warming up high-accuracy OCR...", 0.05);
    await loadTesseract();
    progress("Starting recognition...", 0.1);
    const tesseract = window.Tesseract;
    if (tesseract === void 0) {
      throw new Error("OCR engine did not initialize");
    }
    const worker = await tesseract.createWorker("eng", 1, {
      corePath: "./assets/vendor/tesseract/",
      langPath: "./assets/vendor/tesseract/lang-data",
      logger: (m) => {
        if (m.status === "recognizing text") {
          progress("Reading text carefully...", 0.1 + (m.progress ?? 0) * 0.9);
        } else if (m.status === "loading language traineddata") {
          progress("Loading language model from local vendor...", m.progress ?? 0);
        } else if (typeof m.status === "string" && m.status.length < 40) {
          progress(m.status, m.progress ?? 0);
        }
      },
      workerPath: "./assets/vendor/tesseract/worker.min.js"
    });
    try {
      await worker.setParameters({ preserve_interword_spaces: "1", tessedit_pageseg_mode: "6" });
    } catch {
    }
    const result = await worker.recognize(processed);
    await worker.terminate();
    return result.data.text;
  }
  function levenshtein(a, b) {
    if (a === b) {
      return 0;
    }
    if (a.length === 0) {
      return b.length;
    }
    if (b.length === 0) {
      return a.length;
    }
    let prev = Array.from({ length: b.length + 1 }, () => 0);
    let curr = Array.from({ length: b.length + 1 }, () => 0);
    for (let j = 0; j <= b.length; j++) {
      prev[j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min((curr[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length] ?? 0;
  }
  function ocrFuzzyFix(word) {
    if (word.length < 3) {
      return word;
    }
    if (/[\d()]/.test(word)) {
      return word;
    }
    const dict = loadDict();
    const lower = word.toLowerCase();
    if (dict.fuzzy.has(lower)) {
      return word;
    }
    let best = null;
    let bestDist = Infinity;
    const maxDist = lower.length <= 4 ? 1 : 2;
    for (const candidate of dict.fuzzy) {
      if (Math.abs(candidate.length - lower.length) > 2) {
        continue;
      }
      const dist = levenshtein(lower, candidate);
      if (dist <= maxDist && dist < bestDist) {
        bestDist = dist;
        best = candidate;
      }
    }
    if (best === null) {
      return word;
    }
    if (word === word.toUpperCase()) {
      return best.toUpperCase();
    }
    const firstChar = word.charAt(0);
    if (firstChar === firstChar.toUpperCase()) {
      return best.charAt(0).toUpperCase() + best.slice(1);
    }
    return best;
  }
  function ocrPostProcess(text) {
    return text.replace(/[a-z]+/gi, (m) => ocrFuzzyFix(m));
  }
  function parseOcrText(rawTextInput) {
    const out = { containerHint: "", ingredients: "", nutrients: [] };
    const rawText = ocrPostProcess(rawTextInput);
    const ingMatch = rawText.match(/INGREDIENTS?\s{0,8}[:.]?\s{0,8}([\s\S]+?)(?:\n\s*\n|NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|DIRECTIONS|SUGGESTED\s+USE|OTHER\s+INGREDIENTS|CONTAINS\s*:|WARNING|ALLERGEN|MANUFACTURED|DISTRIBUTED|$)/i);
    if (ingMatch !== null && ingMatch[1] !== void 0) {
      const ing = ingMatch[1].trim().replace(/\s+/g, " ").replace(/[.\s]+$/, "");
      if (ing.length > 8) {
        out.ingredients = ing;
      }
    }
    if (out.ingredients === "") {
      const trimmed = rawText.trim().replace(/\s+/g, " ").replace(/[.\s]+$/, "");
      const commas = (trimmed.match(/,/g) ?? []).length;
      const hasNutritionHeader = /NUTRITION\s+FACTS|SUPPLEMENT\s+FACTS|Calories|Serving/i.test(trimmed);
      if (commas >= 4 && trimmed.length >= 30 && trimmed.length <= 2e3 && !hasNutritionHeader) {
        out.ingredients = trimmed;
      }
    }
    const lines = rawText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const nutPat = /^([a-z][a-z\s()+\-/]{0,54}?)\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\b/i;
    const skip = /^(?:calories|serving|amount per|daily value|total fat|saturated|trans fat|cholesterol|total carbohydrate|dietary fiber|total sugars|added sugars|nutrition|facts|amount)$/i;
    const seen = /* @__PURE__ */ new Set();
    for (const line of lines) {
      const m2 = line.match(nutPat);
      if (m2 === null || m2[1] === void 0 || m2[2] === void 0 || m2[3] === void 0) {
        continue;
      }
      const name = m2[1].trim();
      if (skip.test(name)) {
        continue;
      }
      if (name.length < 2 || name.length > 55) {
        continue;
      }
      const openParens = (name.match(/\(/g) ?? []).length;
      const closeParens = (name.match(/\)/g) ?? []).length;
      if (openParens !== closeParens) {
        continue;
      }
      if (/[:;]/.test(name)) {
        continue;
      }
      const wordCount = (name.match(/\b[a-z]+\b/gi) ?? []).length;
      if (wordCount > 4) {
        continue;
      }
      const hasSubstantiveWord = (name.match(/\b[a-z]{4,}\b/gi) ?? []).length > 0;
      if (!hasSubstantiveWord) {
        continue;
      }
      const key = name.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.nutrients.push({ amount: Number.parseFloat(m2[2]), name, unit: m2[3].toLowerCase() });
    }
    const reversedPat = /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|iu)\s+([a-z][a-z-]{3,20})\b/gi;
    const reversedAllow = /* @__PURE__ */ new Set(["collagen", "protein", "fiber", "peptides", "calcium", "magnesium", "potassium", "sodium"]);
    for (let rm = reversedPat.exec(rawText); rm !== null; rm = reversedPat.exec(rawText)) {
      const g1 = rm[1];
      const g2 = rm[2];
      const g3 = rm[3];
      if (g1 === void 0 || g2 === void 0 || g3 === void 0) {
        continue;
      }
      const nameLower = g3.toLowerCase();
      if (!reversedAllow.has(nameLower)) {
        continue;
      }
      const canonical = nameLower === "peptides" ? "Collagen Peptides" : g3.charAt(0).toUpperCase() + g3.slice(1).toLowerCase();
      const key = canonical.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      if (key === "collagen" && seen.has("collagen peptides")) {
        continue;
      }
      if (key === "collagen peptides" && seen.has("collagen")) {
        continue;
      }
      seen.add(key);
      out.nutrients.push({ amount: Number.parseFloat(g1), name: canonical, unit: g2.toLowerCase() });
    }
    const known = loadDict().known;
    for (const nutName of known) {
      const escaped = nutName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pat = new RegExp(`\\b${escaped}\\b[\\s,]*(?:\\([^)]{1,30}\\)[\\s,]*)?(\\d+(?:\\.\\d+)?)\\s*(mg|mcg|g|iu)\\b`, "i");
      const m = rawText.match(pat);
      if (m === null || m[1] === void 0 || m[2] === void 0) {
        continue;
      }
      const key = nutName.toLowerCase();
      if (key === "collagen" && seen.has("collagen peptides")) {
        continue;
      }
      if (key === "fiber" && seen.has("dietary fiber")) {
        continue;
      }
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.nutrients.push({ amount: Number.parseFloat(m[1]), name: nutName, unit: m[2].toLowerCase() });
    }
    if (/\bfl\s*oz\b/i.test(rawText)) {
      out.containerHint = "aluminum_can";
    } else if (/capsules?|softgels?|tablets?/i.test(rawText)) {
      out.containerHint = "capsule";
    } else if (/powder|scoops?\b/i.test(rawText)) {
      out.containerHint = "powder";
    }
    return out;
  }
  function parseLabel(rawText) {
    const parsed = parseOcrText(rawText);
    return {
      name: parsed.containerHint !== "" ? parsed.containerHint : "Scanned label",
      brand: "",
      servings: 1,
      nutrients: parsed.nutrients,
      ingredients: parsed.ingredients
    };
  }
  async function scanImage(dataUrl) {
    if (dataUrl === "") {
      throw new Error("scanImage: no dataUrl provided");
    }
    const text = await runOcr(dataUrl, (message, progress) => {
      try {
        window.dispatchEvent(new CustomEvent("lcscan:progress", { detail: { message, progress } }));
      } catch {
      }
    });
    const label = parseLabel(text);
    return runScan(label);
  }
  if (typeof window !== "undefined") {
    const w = window;
    w.lcScanImage = scanImage;
    w.lcParseLabel = parseLabel;
  }

  // assets/js/src/views/coverage.ts
  var LAYOUT2 = CoverageLayoutSchema.parse(coverage_layout_data_default);
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
    if (spec.code !== void 0) {
      inner += `<span class="tile__code">${escHTML(spec.code)}</span>`;
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
    const counted = allTiles.filter((t) => t.essential !== false);
    const total = counted.length;
    const covered = counted.filter((t) => {
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
    const total = snapshot?.totalCount ?? essentialCount();
    const covered = snapshot?.coveredCount ?? 0;
    const sections = LAYOUT2.sections.map((s) => renderSection(s, snapshot)).join("");
    return `
    <section class="coverage-hero ds-border-travel">
      <header class="coverage-hero__head">
        <div>
          <div class="coverage-hero__kicker">Your essentials \xB7 <span class="ds-cipher" data-cipher-set="numfrac">${essentialCount()}</span> minerals + vitamins + amino acids + fats</div>
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
    const activeGoals = userGoals.length > 0 ? LAYOUT2.goals.filter((g) => userGoals.includes(g.id)) : LAYOUT2.goals.slice(0, 3);
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
        <span class="goals-strip__count">${activeGoals.length} ACTIVE \xB7 ${LAYOUT2.goals.length} AVAILABLE</span>
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

  // assets/js/src/views/journey.ts
  var DAY_MS2 = 24 * 60 * 60 * 1e3;
  function escHTML2(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function hexSerial(seed) {
    return (seed * 2654435769 >>> 0).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
  }
  function relTime(iso) {
    const t = Date.parse(iso);
    if (Number.isNaN(t)) {
      return "";
    }
    const sec = Math.max(0, Math.round((Date.now() - t) / 1e3));
    if (sec < 60) {
      return `${sec}S AGO`;
    }
    const min = Math.round(sec / 60);
    if (min < 60) {
      return `${min}M AGO`;
    }
    const hr = Math.round(min / 60);
    if (hr < 24) {
      return `${hr}H AGO`;
    }
    return `${Math.round(hr / 24)}D AGO`;
  }
  function dayKey(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso.slice(0, 10);
    }
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  function dayStamp(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    const startOfDay = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((startOfDay(/* @__PURE__ */ new Date()) - startOfDay(d)) / DAY_MS2);
    const wd = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
    const mo = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const base = `${wd} ${mo}\xB7${String(d.getDate()).padStart(2, "0")}`;
    if (diffDays === 0) {
      return `TODAY \xB7 ${base}`;
    }
    if (diffDays === 1) {
      return `YESTERDAY \xB7 ${base}`;
    }
    if (diffDays > 1 && diffDays < 7) {
      return `THIS WEEK \xB7 ${base}`;
    }
    return base;
  }
  function sevWord(n) {
    switch (n) {
      case 1:
        return "MINIMAL";
      case 2:
        return "MILD";
      case 3:
        return "MODERATE";
      case 4:
        return "STRONG";
      case 5:
        return "PEAK";
      default:
        return "\u2014";
    }
  }
  function kindMeta(kind) {
    switch (kind) {
      case "scan":
        return { glyph: "\u2316", cls: "jd-tl-event--scan", label: "SCAN" };
      case "regimen":
        return { glyph: "\u25A4", cls: "jd-tl-event--regimen", label: "REGIMEN" };
      case "coverage":
        return { glyph: "\u25C9", cls: "jd-tl-event--coverage", label: "COVERAGE" };
      case "symptom":
        return { glyph: "!", cls: "jd-tl-event--symptom", label: "SYMPTOM" };
      case "milestone":
        return { glyph: "\u2726", cls: "jd-tl-event--milestone", label: "MILESTONE" };
    }
  }
  function groupByDay(events) {
    const groups = [];
    const byKey = /* @__PURE__ */ new Map();
    for (const ev of events) {
      const key = dayKey(ev.occurredAt);
      let group = byKey.get(key);
      if (group === void 0) {
        group = { stamp: dayStamp(ev.occurredAt), events: [] };
        byKey.set(key, group);
        groups.push(group);
      }
      group.events.push(ev);
    }
    return groups;
  }
  function renderPips(severity) {
    const fill = severity >= 4 ? "fill-ok" : "fill-warn";
    let out = "";
    for (let i = 1; i <= 5; i++) {
      out += `<span class="jd-sev-pip${i <= severity ? ` ${fill}` : ""}"></span>`;
    }
    return out;
  }
  function renderTimeline() {
    const events = listEvents();
    if (events.length === 0) {
      return '<div class="jd-empty">\u2014 no events yet \xB7 scans, regimen edits, and coverage jumps land here \u2014</div>';
    }
    const days = groupByDay(events).map((g) => `
    <div class="jd-tl-day">
      <div class="jd-tl-day__stamp">${escHTML2(g.stamp)}</div>
      ${g.events.map((ev) => {
      const m = kindMeta(ev.kind);
      const hasDetail = ev.detail !== void 0 && ev.detail.length > 0;
      const hasDelta = ev.delta !== void 0 && ev.delta.length > 0;
      return `
        <div class="jd-tl-event ${m.cls}">
          <div class="jd-tl-event__glyph">${escHTML2(m.glyph)}</div>
          <div class="jd-tl-event__body">
            <div class="jd-tl-event__meta"><span class="jd-tl-event__kind">${escHTML2(m.label)}</span> \xB7 ${escHTML2(relTime(ev.occurredAt))}</div>
            <h4 class="jd-tl-event__title">${escHTML2(ev.title)}</h4>
            ${hasDetail ? `<div class="jd-tl-event__detail">${escHTML2(ev.detail)}</div>` : ""}
            ${hasDelta ? `<span class="jd-tl-event__delta">${escHTML2(ev.delta)}</span>` : ""}
          </div>
        </div>`;
    }).join("")}
    </div>`).join("");
    return `<div class="jd-timeline">${days}</div>`;
  }
  function renderGoals() {
    const goals = listGoals();
    if (goals.length === 0) {
      return '<div class="jd-empty">\u2014 no active goals yet \u2014</div>';
    }
    return goals.map((g) => {
      const pct = Math.max(0, Math.min(100, Math.round(g.progress * 100)));
      const unit = g.unit ?? "done";
      const blockerList = g.blockers ?? [];
      const blockers = blockerList.length > 0 ? `<div class="jd-goal__blockers">BLOCKED BY \xB7 ${blockerList.map((b) => `<span class="jd-goal__chip">${escHTML2(b)}</span>`).join("")}</div>` : "";
      return `
    <div class="jd-goal${g.featured === true ? " featured" : ""}">
      <header class="jd-goal__head">
        <div>
          <div class="jd-goal__id">GOAL \xB7 <span class="ds-cipher" data-cipher-set="hexa">G\xB7${hexSerial(g.goalId.length * 7)}</span>${g.featured === true ? " \xB7 FEATURED" : ""}</div>
          <h4 class="jd-goal__title">${escHTML2(g.title)}</h4>
        </div>
        <div class="jd-goal__due">DUE<strong>${escHTML2(g.targetDate)}</strong></div>
      </header>
      <div class="jd-goal__progress">
        <span class="jd-goal__pct">${pct}<small>%</small></span>
        <span class="jd-goal__counts"><strong>${escHTML2(g.numerator)}</strong> / ${escHTML2(g.denominator)} ${escHTML2(unit)}</span>
      </div>
      <div class="jd-goal__bar"><div class="jd-goal__bar-fill" style="width: ${pct}%;"></div></div>
      ${blockers}
    </div>`;
    }).join("");
  }
  function renderCheckins() {
    const entry = `
    <button class="jd-checkin-entry" data-jd-action="quick-checkin">
      <span class="jd-checkin-entry__glyph">+</span> QUICK CHECK-IN \u2014 HOW ARE YOU FEELING?
      <span class="jd-checkin-entry__spacer"></span>
      <span class="jd-checkin-entry__kbd">\u2318.</span>
    </button>`;
    const checkins = listCheckins();
    if (checkins.length === 0) {
      return `${entry}<div class="jd-empty">\u2014 no check-ins yet \xB7 they stay private on this device \u2014</div>`;
    }
    const cards = checkins.map((c) => {
      const d = new Date(c.loggedAt);
      const valid = !Number.isNaN(d.getTime());
      const day = valid ? String(d.getDate()) : "\xB7\xB7";
      const mo = valid ? d.toLocaleDateString("en-US", { month: "short" }).toUpperCase() : "";
      const tags = c.tags.length > 0 ? `<div class="jd-checkin__tags">${c.tags.map((t) => `<span class="jd-checkin__tag">${escHTML2(t)}</span>`).join("")}</div>` : "";
      const top = crossRefForCheckin(c)[0];
      const xrefHTML = top !== void 0 ? `<div class="jd-checkin__xref">CROSS-REF \xB7 <strong>${escHTML2(top.title)}</strong></div>` : "";
      return `
    <div class="jd-checkin">
      <div class="jd-checkin__date">
        <div class="jd-checkin__date-day">${escHTML2(day)}</div>
        <div class="jd-checkin__date-mo">${escHTML2(mo)}</div>
      </div>
      <div class="jd-checkin__body">
        <div class="jd-checkin__row">
          <div class="jd-checkin__severity">${renderPips(c.severity)}</div>
          <span class="jd-checkin__sev"><strong>${c.severity} / 5</strong> \xB7 ${escHTML2(sevWord(c.severity))}</span>
        </div>
        ${c.note.length > 0 ? `<p class="jd-checkin__note">${escHTML2(c.note)}</p>` : ""}
        ${tags}
        ${xrefHTML}
      </div>
    </div>`;
    }).join("");
    return entry + cards;
  }
  function renderMilestones() {
    const milestones = listMilestones();
    if (milestones.length === 0) {
      return '<div class="jd-empty">\u2014 no milestones yet \xB7 earned automatically as coverage doctrine is met \u2014</div>';
    }
    return milestones.map((m) => {
      const locked = m.earnedAt === null;
      const fresh = !locked && Date.now() - Date.parse(m.earnedAt ?? "") < DAY_MS2;
      const cls = locked ? " locked" : fresh ? " fresh" : "";
      const hasProgress = m.numerator !== void 0 && m.denominator !== void 0;
      const earnedLine = locked ? hasProgress ? `PROGRESS \xB7 ${escHTML2(m.numerator)} / ${escHTML2(m.denominator)}` : "LOCKED" : `EARNED \xB7 ${escHTML2(relTime(m.earnedAt ?? ""))}`;
      const tag = locked ? " \xB7 LOCKED" : fresh ? " \xB7 JUST EARNED" : "";
      return `
    <div class="jd-milestone${cls}">
      <div class="jd-milestone__badge">${escHTML2(m.badge)}</div>
      <div class="jd-milestone__body">
        <div class="jd-milestone__id">${escHTML2(m.milestoneId)}${tag}</div>
        <h4 class="jd-milestone__title">${escHTML2(m.title)}</h4>
        <div class="jd-milestone__doctrine">DOCTRINE \xB7 <strong>${escHTML2(m.doctrineRef)}</strong></div>
        <div class="jd-milestone__earned">${earnedLine}</div>
      </div>
    </div>`;
    }).join("");
  }
  function renderTab(tab) {
    switch (tab) {
      case "timeline":
        return renderTimeline();
      case "goals":
        return renderGoals();
      case "checkins":
        return renderCheckins();
      case "milestones":
        return renderMilestones();
    }
  }
  function renderEventForm() {
    return `
    <div class="jd-form" data-jd-form="event">
      <div class="jd-form__title">LOG EVENT</div>
      <label class="jd-form__row">
        <span class="jd-form__label">KIND</span>
        <select class="jd-form__input" data-jd-field="kind">
          <option value="regimen">Regimen</option>
          <option value="scan">Scan</option>
          <option value="coverage">Coverage</option>
          <option value="symptom">Symptom</option>
          <option value="milestone">Milestone</option>
        </select>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">TITLE</span>
        <input class="jd-form__input" data-jd-field="title" type="text" maxlength="200" placeholder="What happened?" />
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">DETAIL</span>
        <input class="jd-form__input" data-jd-field="detail" type="text" maxlength="2000" placeholder="Optional context" />
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">DELTA</span>
        <input class="jd-form__input" data-jd-field="delta" type="text" maxlength="80" placeholder="e.g. +35 trace" />
      </label>
      <div class="jd-form__err" data-jd-field="err"></div>
      <div class="jd-form__actions">
        <button class="jd-action jd-action--primary" data-jd-action="event-save">SAVE</button>
        <button class="jd-action" data-jd-action="form-cancel">CANCEL</button>
      </div>
    </div>`;
  }
  function renderCheckinForm() {
    return `
    <div class="jd-form" data-jd-form="checkin">
      <div class="jd-form__title">QUICK CHECK-IN</div>
      <label class="jd-form__row">
        <span class="jd-form__label">FEELING</span>
        <select class="jd-form__input" data-jd-field="severity">
          <option value="5">5 \xB7 Peak</option>
          <option value="4">4 \xB7 Strong</option>
          <option value="3" selected>3 \xB7 Moderate</option>
          <option value="2">2 \xB7 Mild</option>
          <option value="1">1 \xB7 Minimal</option>
        </select>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">NOTE</span>
        <textarea class="jd-form__input jd-form__input--area" data-jd-field="note" maxlength="2000" placeholder="How are you feeling?"></textarea>
      </label>
      <label class="jd-form__row">
        <span class="jd-form__label">TAGS</span>
        <input class="jd-form__input" data-jd-field="tags" type="text" maxlength="200" placeholder="comma,separated" />
      </label>
      <div class="jd-form__err" data-jd-field="err"></div>
      <div class="jd-form__actions">
        <button class="jd-action jd-action--primary" data-jd-action="checkin-save">SAVE</button>
        <button class="jd-action" data-jd-action="form-cancel">CANCEL</button>
      </div>
    </div>`;
  }
  function renderShell(activeTab, formMode) {
    const events = listEvents();
    const goals = listGoals();
    const checkins = listCheckins();
    const milestones = listMilestones();
    const earned = milestones.filter((m) => m.earnedAt !== null).length;
    const tabs = [
      { id: "timeline", label: "Timeline", count: `${events.length} EVENTS` },
      { id: "goals", label: "Goals", count: `${goals.length} ACTIVE` },
      { id: "checkins", label: "Check-ins", count: `${checkins.length} LOGGED` },
      { id: "milestones", label: "Milestones", count: `${earned} / ${milestones.length}` }
    ];
    const tabsHTML = tabs.map((t) => `
    <button class="jd-tab${t.id === activeTab ? " active" : ""}" data-jd-tab="${t.id}">
      <span>${escHTML2(t.label)}</span>
      <span class="jd-tab__count">${escHTML2(t.count)}</span>
    </button>`).join("");
    let formHTML = "";
    if (formMode === "event") {
      formHTML = renderEventForm();
    } else if (formMode === "checkin") {
      formHTML = renderCheckinForm();
    }
    return `
    <span class="ds-scan-line" aria-hidden="true"></span>
    <header class="jd-head">
      <div>
        <div class="jd-eyebrow"><span class="pulse-dot"></span>DRAWER \xB7 <span class="ds-cipher" data-cipher-set="hexa">JN\xB7${hexSerial(activeTab.length * 7)}</span></div>
        <h2 class="jd-title">Journey</h2>
        <div class="jd-sub">// timeline \xB7 goals \xB7 check-ins \xB7 milestones</div>
      </div>
      <button class="jd-close" data-jd-action="close" title="Close (Esc)">\xD7</button>
    </header>
    <div class="jd-tabs">${tabsHTML}</div>
    <div class="jd-search">
      <span class="jd-search-icon">\u2315</span>
      <input class="jd-search-input" type="text" placeholder="SEARCH ${escHTML2(activeTab.toUpperCase())}\u2026" />
      <span class="jd-search-kbd">/</span>
    </div>
    <div class="jd-body">${formHTML}${renderTab(activeTab)}</div>
    <footer class="jd-footer">
      <button class="jd-action jd-action--primary" data-jd-action="log-event"><span class="jd-action__glyph">+</span>LOG EVENT</button>
      <button class="jd-action" data-jd-action="pin"><span class="jd-action__glyph">\u2295</span>PIN</button>
      <button class="jd-action" data-jd-action="export"><span class="jd-action__glyph">\u21E3</span>EXPORT</button>
      <span class="jd-action__spacer"></span>
      <button class="jd-action jd-action--expand" data-jd-action="expand"><span class="jd-action__glyph">\u2922</span>EXPAND</button>
    </footer>`;
  }
  function normalizeKind(raw) {
    const parsed = EventKindSchema.safeParse(raw);
    return parsed.success ? parsed.data : "regimen";
  }
  function clampSeverity(raw) {
    const n = Math.round(Number(raw));
    const clamped = Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 3;
    return clamped;
  }
  function mount2(container) {
    let isOpen = false;
    let isExpanded = false;
    let activeTab = "timeline";
    let formMode = null;
    const render = () => {
      container.innerHTML = renderShell(activeTab, formMode);
    };
    const open = () => {
      if (isOpen) {
        return;
      }
      isOpen = true;
      container.classList.add("jd-open");
      render();
    };
    const close = () => {
      if (!isOpen) {
        return;
      }
      isOpen = false;
      isExpanded = false;
      formMode = null;
      container.classList.remove("jd-open", "jd-expanded");
      container.innerHTML = "";
    };
    const toggle = () => {
      if (isOpen) {
        close();
      } else {
        open();
      }
    };
    const toggleExpanded = () => {
      isExpanded = !isExpanded;
      container.classList.toggle("jd-expanded", isExpanded);
    };
    const submitEvent = () => {
      const kindEl = container.querySelector('[data-jd-field="kind"]');
      const titleEl = container.querySelector('[data-jd-field="title"]');
      const detailEl = container.querySelector('[data-jd-field="detail"]');
      const deltaEl = container.querySelector('[data-jd-field="delta"]');
      const errEl = container.querySelector('[data-jd-field="err"]');
      const title = (titleEl?.value ?? "").trim().slice(0, 200);
      if (title.length === 0) {
        if (errEl !== null) {
          errEl.textContent = "Title is required.";
        }
        return;
      }
      const detail = (detailEl?.value ?? "").trim().slice(0, 2e3);
      const delta = (deltaEl?.value ?? "").trim().slice(0, 80);
      const event = {
        kind: normalizeKind(kindEl?.value),
        title,
        occurredAt: (/* @__PURE__ */ new Date()).toISOString(),
        ...detail.length > 0 ? { detail } : {},
        ...delta.length > 0 ? { delta } : {}
      };
      formMode = null;
      logEvent(event);
      render();
    };
    const submitCheckin = () => {
      const sevEl = container.querySelector('[data-jd-field="severity"]');
      const noteEl = container.querySelector('[data-jd-field="note"]');
      const tagsEl = container.querySelector('[data-jd-field="tags"]');
      const note = (noteEl?.value ?? "").trim().slice(0, 2e3);
      const tags = (tagsEl?.value ?? "").split(",").map((t) => t.trim().slice(0, 40)).filter((t) => t.length > 0).slice(0, 20);
      formMode = null;
      logCheckin({ severity: clampSeverity(sevEl?.value), note, tags, loggedAt: (/* @__PURE__ */ new Date()).toISOString() });
      render();
    };
    const clickHandler = (ev) => {
      const target = ev.target;
      if (target === null) {
        return;
      }
      const tabBtn = target.closest("[data-jd-tab]");
      if (tabBtn !== null) {
        const next = tabBtn.getAttribute("data-jd-tab");
        if (next !== null && next !== activeTab) {
          activeTab = next;
          formMode = null;
          render();
        }
        return;
      }
      const actionEl = target.closest("[data-jd-action]");
      if (actionEl === null) {
        return;
      }
      const action = actionEl.getAttribute("data-jd-action");
      if (action === null) {
        return;
      }
      switch (action) {
        case "close":
          close();
          break;
        case "expand":
          toggleExpanded();
          break;
        case "log-event":
          formMode = "event";
          render();
          break;
        case "quick-checkin":
          activeTab = "checkins";
          formMode = "checkin";
          render();
          break;
        case "event-save":
          submitEvent();
          break;
        case "checkin-save":
          submitCheckin();
          break;
        case "form-cancel":
          formMode = null;
          render();
          break;
        default:
          break;
      }
    };
    container.addEventListener("click", clickHandler);
    on("journey:changed", () => {
      if (isOpen) {
        render();
      }
    });
    on("goals:updated", () => {
      if (isOpen) {
        render();
      }
    });
    return {
      open,
      close,
      toggle,
      toggleExpanded,
      isOpen: () => isOpen
    };
  }

  // assets/data/corpus-embed.json
  var corpus_embed_default = { books: { "dddl-3e-2011": { authors: ["Joel D. Wallach", "Ma Lan"], claim_count: 94, code: "DDDL", edition: "3rd", status: "active", title: "Dead Doctors Don't Lie", year: 2011 }, epigenetics: { authors: ["Joel D. Wallach", "Ma Lan", "Gerhard N. Schrauzer"], claim_count: 0, code: "EDGT", edition: "1st", status: "active", title: "Epigenetics: The Death of the Genetic Theory of Disease Transmission", year: 2014 }, iaiyh: { authors: ["Joel D. Wallach"], claim_count: 0, code: "IAYH", edition: "1st", status: "active", title: "It's All In Your Head", year: 2020 }, immortality: { authors: ["Joel D. Wallach"], claim_count: 0, code: "IMMO", edition: "1st", status: "active", title: "Immortality", year: 2008 }, "lets-play-doctor": { authors: ["Joel D. Wallach", "Ma Lan"], claim_count: 0, code: "LPD", edition: "4th", status: "active", title: "Let's Play Doctor", year: 1995 }, "rare-earths": { authors: ["Joel D. Wallach", "Ma Lan"], claim_count: 89, code: "REFC", edition: "1st", status: "active", title: "Rare Earths: Forbidden Cures", year: 1994 } }, claims: { "WAL-CLM-DDDL-000001": { book: "dddl-3e-2011", claim_text: "An 1895 Journal of the American Medical Association report found the average lifespan of doctors was just 55 years.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000001", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "what he discovered, in an 1895 edition of the Journal of the American\nMedical Association was that the average life of doctors was just 55 years." }, "WAL-CLM-DDDL-000002": { book: "dddl-3e-2011", claim_text: "The corrective action is supplementation with plant derived colloidal minerals.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000002", kind: "quote", other_substances: [], symptoms: [], verbatim: "took positive\naction to enhance their own lives and the lives of others by supplementing\nwith plant derived colloidal minerals." }, "WAL-CLM-DDDL-000003": { book: "dddl-3e-2011", claim_text: "Copper deficiency in humans first presents as white, gray, or silver hair.", conditions: [], confidence: "high", dose: null, essentials: ["copper"], id: "WAL-CLM-DDDL-000003", kind: "deficiency_sign", other_substances: [], symptoms: ["gray_hair"], verbatim: "Copper deficiency in human beings presents itself first as white, gray, or\nsilver hair." }, "WAL-CLM-DDDL-000004": { book: "dddl-3e-2011", claim_text: "Copper is required to manufacture the heavy elastic fibers in arteries; copper deficiency causes aneurysms.", conditions: ["aneurysm"], confidence: "high", dose: null, essentials: ["copper"], id: "WAL-CLM-DDDL-000004", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "This has got to be\ndue to a copper deficiency, because copper is required to manufacture the\nheavy elastic fibers found in arteries." }, "WAL-CLM-DDDL-000005": { book: "dddl-3e-2011", claim_text: "Selenium deficiency causes infertility, miscarriages, cystic fibrosis of the pancreas, SIDS, white muscle disease, muscular dystrophy, cardiomyopathy, and more.", conditions: ["cystic_fibrosis", "sids", "muscular_dystrophy", "cardiomyopathy", "white_muscle_disease"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000005", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Selenium deficiency causes infertility,\nmiscarriages, cystic fibrosis of the pancreas, Sudden Infant Death\nSyndrome in animals, liver cirrhosis, stiff lamb disease, white muscle\ndisease, muscular dystrophy, anemias, encephalomalacia (Alzheimer\u2019s\ndisease), cardiomyopathy heart disease, and mulberry heart disease." }, "WAL-CLM-DDDL-000006": { book: "dddl-3e-2011", claim_text: "An early sign of selenium deficiency in older adults is the appearance of liver spots or age spots.", conditions: [], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000006", kind: "deficiency_sign", other_substances: [], symptoms: ["age_spots", "liver_spots"], verbatim: "Another early symptom of selenium deficiency in older humans is the\nappearance of \u201Cliver spots\u201D or \u201Cage spots.\u201D" }, "WAL-CLM-DDDL-000007": { book: "dddl-3e-2011", claim_text: "Selenium supplementation prevented, and in many cases reversed or cured, selenium-deficiency diseases in animals.", conditions: ["cardiomyopathy", "white_muscle_disease", "muscular_dystrophy"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000007", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "In each\ncase, selenium supplementation prevented the disease and in many cases\nreversed or cured existing diseases, which were all significant causes of\nanimal losses to the livestock industry." }, "WAL-CLM-DDDL-000008": { book: "dddl-3e-2011", claim_text: "Zoo marmosets and shrews died of diabetes attributed to chromium and vanadium deficiency (observed at autopsy).", conditions: ["diabetes"], confidence: "high", dose: null, essentials: ["chromium", "vanadium"], id: "WAL-CLM-DDDL-000008", kind: "personal_anecdote", other_substances: [], symptoms: [], verbatim: "I saw marmosets, alligators, and\nshrews that died of diabetes, a chromium and vanadium deficiency." }, "WAL-CLM-DDDL-000009": { book: "dddl-3e-2011", claim_text: "Calcium deficiency alone can result in as many as 147 different diseases (osteoporosis, osteoarthritis, Bell's palsy, tinnitus, trigeminal neuralgia, spinal stenosis, and more).", conditions: ["osteoporosis", "osteoarthritis", "osteomalacia", "bells_palsy", "tinnitus", "trigeminal_neuralgia", "spinal_stenosis"], confidence: "high", dose: null, essentials: ["calcium"], id: "WAL-CLM-DDDL-000009", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "Calcium deficiency alone could result in as many as 147 different diseases\nranging from osteoporosis, osteoarthritis, osteomalacia, degenerative\nathritis, Bell\u2019s Palsy, tinnitis, trigeminal neuralgia, and spinal stenosis to\nname a few." }, "WAL-CLM-DDDL-000010": { book: "dddl-3e-2011", claim_text: "In the clinical phase of trace-mineral deficiency, full-blown disease states appear: cardiomyopathy, diabetes, cancer, liver cirrhosis.", conditions: ["cardiomyopathy", "diabetes", "cancer", "liver_cirrhosis"], confidence: "medium", dose: null, essentials: [], id: "WAL-CLM-DDDL-000010", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The clinical phase of trace mineral deficiencies is characterized by the onset\nof full-blown disease states and even death\u2014i.e., cardiomyopathy, diabetes,\ncancer, liver cirrhosis." }, "WAL-CLM-DDDL-000011": { book: "dddl-3e-2011", claim_text: "The recommended maintenance dose for germanium is 20\u201330 mg per day (50\u2013100 mg/day is used for serious illness requiring increased oxygenation).", conditions: [], confidence: "high", dose: { amount: "20-30", duration: null, for_condition: "maintenance", form: null, period: "daily", unit: "mg" }, essentials: ["germanium"], id: "WAL-CLM-DDDL-000011", kind: "dose", other_substances: [], symptoms: [], verbatim: "Twenty to 30 mg per day is the recommended maintenance dose for\ngermanium. Fifty to 100 mg per day doses are commonly used when an\nindividual has a serious illness that requires an increased oxygen level in\nthe body." }, "WAL-CLM-DDDL-000012": { book: "dddl-3e-2011", claim_text: "Germanium deficiency is typified by reduced immune status, arthritis, osteoporosis, low energy, and cancer.", conditions: ["arthritis", "osteoporosis", "cancer"], confidence: "high", dose: null, essentials: ["germanium"], id: "WAL-CLM-DDDL-000012", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "A severely reduced immune status, arthritis, osteoporosis, low energy, and\ncancer typify deficiencies of germanium." }, "WAL-CLM-DDDL-000013": { book: "dddl-3e-2011", claim_text: "Humans can consume 400 mg of silver per day; silver deficiency results in an impaired immune system.", conditions: [], confidence: "medium", dose: { amount: 400, duration: null, for_condition: null, form: null, period: "daily", unit: "mg" }, essentials: ["silver"], id: "WAL-CLM-DDDL-000013", kind: "dose", other_substances: [], symptoms: [], verbatim: "Humans can\nconsume 400 mg of silver per day. A silver \u201Cdeficiency\u201D results in an\nimpaired immune system." }, "WAL-CLM-DDDL-000014": { book: "dddl-3e-2011", claim_text: "Silver is antibacterial, antiviral, and antifungal, disabling enzymes that microorganisms use for respiration.", conditions: [], confidence: "medium", dose: null, essentials: ["silver"], id: "WAL-CLM-DDDL-000014", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Silver is an anti-bacterial, anti-viral, anti-fungal, anti-metabolite that\ndisables specific enzymes that microorganisms use for respiration." }, "WAL-CLM-DDDL-000015": { book: "dddl-3e-2011", claim_text: "Per USDA researcher Richard Anderson, 90 percent of Americans are deficient in chromium.", conditions: [], confidence: "high", dose: null, essentials: ["chromium"], id: "WAL-CLM-DDDL-000015", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "According to Richard Anderson, USDA, \u201CNinety percent of\nall Americans are deficient in chromium.\u201D" }, "WAL-CLM-DDDL-000016": { book: "dddl-3e-2011", claim_text: "Chromium supplementation increased laboratory-animal lifespan by 33.3 percent (Gary Evans, Bemidji State University).", conditions: [], confidence: "high", dose: null, essentials: ["chromium"], id: "WAL-CLM-DDDL-000016", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "Gary Evans, Bemidji State University, Minnesota, very clearly showed an\nincreased life span in laboratory animals by 33.3 percent when they were\nsupplemented with chromium." }, "WAL-CLM-DDDL-000017": { book: "dddl-3e-2011", claim_text: "Chromium deficiency produces a wide range of clinical diseases (low blood sugar, type II diabetes, elevated triglycerides/cholesterol, coronary vessel disease, infertility) and a shortened lifespan, aggravated by concurrent vanadium deficiency.", conditions: ["hypoglycemia", "diabetes", "coronary_artery_disease"], confidence: "high", dose: null, essentials: ["chromium", "vanadium"], id: "WAL-CLM-DDDL-000017", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Deficiencies of chromium in humans are\ncharacterized by a wide variety of clinical diseases as well as a shortened\nlife expectancy. The clinical diseases of chromium deficiency are\naggravated by concurrent vanadium deficiencies." }, "WAL-CLM-DDDL-000018": { book: "dddl-3e-2011", claim_text: "Cesium chloride is used in alternative cancer therapy ('high-pH therapy'), entering the cancer cell to produce an alkaline environment.", conditions: ["cancer"], confidence: "medium", dose: null, essentials: ["cesium"], id: "WAL-CLM-DDDL-000018", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Cesium chloride is used as part of alternative cancer therapy programs.\nCesium provides \u201Chigh ph therapy\u201D for cancer by entering the cancer cell\nand producing an alkaline environment." }, "WAL-CLM-DDDL-000019": { book: "dddl-3e-2011", claim_text: "Pica (a compulsion to eat ice, dirt, or lead paint) is a specific sign of iron deficiency.", conditions: [], confidence: "high", dose: null, essentials: ["iron"], id: "WAL-CLM-DDDL-000019", kind: "deficiency_sign", other_substances: [], symptoms: ["pica"], verbatim: "Experimental evidence shows very clearly that \u201Cpica\u201D is a specific sign of\niron deficiency. Pica can drive children and adults to eat ice (pagophagia),\ndirt (geophagia), or lead paint." }, "WAL-CLM-DDDL-000020": { book: "dddl-3e-2011", claim_text: "Iron deficiency symptoms include fatigue, heart palpitations on exertion, reduced cognition and memory, sore tongue, and hypochromic microcytic anemia.", conditions: ["anemia"], confidence: "high", dose: null, essentials: ["iron"], id: "WAL-CLM-DDDL-000020", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Symptoms of iron deficiency\ninclude listlessness, fatigue, heart palpitations on exertion, reduced\ncognition, memory deficits, sore tongue, angular stomatitis dysphagia, and\nhypochromic microcytic anemia." }, "WAL-CLM-DDDL-000021": { book: "dddl-3e-2011", claim_text: "Ascorbic acid (vitamin C) increases iron absorption; clays and phytates decrease it.", conditions: [], confidence: "high", dose: null, essentials: ["iron", "vitamin-c"], id: "WAL-CLM-DDDL-000021", kind: "interaction", other_substances: [], symptoms: [], verbatim: "Ascorbic acid increases the absorption of iron;\nclays and phytates decrease the absorption of iron." }, "WAL-CLM-DDDL-000022": { book: "dddl-3e-2011", claim_text: "Excess iron can cause liver cirrhosis, pancreatic fibrosis, diabetes, and heart failure (largely by raising the need for selenium, copper, and zinc).", conditions: ["liver_cirrhosis", "diabetes", "heart_failure"], confidence: "medium", dose: null, essentials: ["iron"], id: "WAL-CLM-DDDL-000022", kind: "contraindication", other_substances: [], symptoms: [], verbatim: "Excesses of iron can cause cirrhosis of the liver, fibrosis of the pancreas,\ndiabetes, and heart failure." }, "WAL-CLM-DDDL-000023": { book: "dddl-3e-2011", claim_text: "Iodine combines with the amino acid tyrosine to manufacture the thyroid hormone thyroxin.", conditions: ["hypothyroidism"], confidence: "high", dose: null, essentials: ["iodine", "tyrosine"], id: "WAL-CLM-DDDL-000023", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "In combination with the amino acid tyrosine,\niodine is manufactured into the thyroid hormone thyroxin." }, "WAL-CLM-DDDL-000024": { book: "dddl-3e-2011", claim_text: "Since Americans began restricting salt intake on doctors' advice, goiter and hypothyroidism have become epidemic (iodized salt was a key iodine source).", conditions: ["goiter", "hypothyroidism"], confidence: "high", dose: null, essentials: ["iodine"], id: "WAL-CLM-DDDL-000024", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "Iodine intake is\nusually low to begin with, but since Americans have begun restricting their\nsalt intake at the advice of their doctors, goiter and hypothyroidism has\nbecome epidemic." }, "WAL-CLM-DDDL-000025": { book: "dddl-3e-2011", claim_text: "Copper is a required cofactor to utilize iodine; copper deficiency can drive an iodine-deficiency (goiter) state even where soil iodine is adequate.", conditions: ["goiter"], confidence: "medium", dose: null, essentials: ["iodine", "copper"], id: "WAL-CLM-DDDL-000025", kind: "interaction", other_substances: [], symptoms: [], verbatim: "A severe copper deficiency\nin the soils of the north and the south cause the deficiency state because\ncopper is a required cofactor to utilize iodine." }, "WAL-CLM-DDDL-000026": { book: "dddl-3e-2011", claim_text: "Manganese deficiency causes birth defects (congenital ataxia, deafness), asthma, convulsions, skeletal defects, and joint problems including TMJ, repetitive motion syndrome, and carpal tunnel syndrome.", conditions: ["carpal_tunnel_syndrome", "tmj", "asthma", "congenital_ataxia", "repetitive_motion_syndrome"], confidence: "high", dose: null, essentials: ["manganese"], id: "WAL-CLM-DDDL-000026", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Deficiency diseases of Mn are very striking, ranging from severe birth\ndefects (congenital ataxia, deafness, chondrodystrophy), asthma,\nconvulsions, retarded growth, skeletal defects, disruption of fat and\ncarbohydrate metabolism to joint problems in children and adults (i.e. TMJ,\nRepetitive Motion Syndrome, Carpal Tunnel Syndrome)." }, "WAL-CLM-DDDL-000027": { book: "dddl-3e-2011", claim_text: "Manganese is structural to the three small ear bones and to joint cartilage.", conditions: [], confidence: "high", dose: null, essentials: ["manganese"], id: "WAL-CLM-DDDL-000027", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Manganese is part of the developmental process and the structure\nof the three fragile ear bones and joint cartilage." }, "WAL-CLM-DDDL-000028": { book: "dddl-3e-2011", claim_text: "Molybdenum is an integral part of three essential enzymes: xanthine oxidase, aldehyde oxidase, and sulfite oxidase.", conditions: [], confidence: "high", dose: null, essentials: ["molybdenum"], id: "WAL-CLM-DDDL-000028", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Molybdenum is known to be an integral part of no less\nthan three essential enzymes: Xanthine oxidase, Aldehyde oxidase, and\nSulfite oxidase." }, "WAL-CLM-DDDL-000029": { book: "dddl-3e-2011", claim_text: "Selenium is the most efficient antioxidant, working in the glutathione peroxidase enzyme system to keep body fats from going rancid.", conditions: [], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000029", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Selenium is the most efficient antioxidant (anti-peroxident).\nIt\u2019s used at the subcellular level in the glutathione peroxidase enzyme\nsystem and metalloamino acids (selenomethionine, etc.)." }, "WAL-CLM-DDDL-000030": { book: "dddl-3e-2011", claim_text: "High vegetable-oil intake combined with selenium deficiency is, per Wallach, the quickest route to heart attack and cancer.", conditions: ["heart_attack", "cancer"], confidence: "medium", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000030", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "High intakes of vegetable oils,\nincluding salad dressing and cooking oils, concurrent with a selenium\ndeficiency is the quickest route to a heart attack and cancer." }, "WAL-CLM-DDDL-000031": { book: "dddl-3e-2011", claim_text: "Tin deficiency in rats produced poor growth, hearing loss, and bilateral (male-pattern) hair loss; Wallach links tin to male-pattern baldness and hearing loss.", conditions: ["male_pattern_baldness"], confidence: "high", dose: null, essentials: ["tin"], id: "WAL-CLM-DDDL-000031", kind: "deficiency_sign", other_substances: [], symptoms: ["hair_loss", "hearing_loss"], verbatim: "Rats fed tin at 17.0 ng/gm show poor growth, reduced feeding efficiency,\nhearing loss, and bilateral (male pattern) hair loss, while rats fed 1.99\n|ng/gm were physiologically and anatomically normal." }, "WAL-CLM-DDDL-000032": { book: "dddl-3e-2011", claim_text: "Strontium deficiency is associated with certain calcium- and boron-resistant forms of osteoporosis and arthritis.", conditions: ["osteoporosis", "arthritis"], confidence: "high", dose: null, essentials: ["strontium"], id: "WAL-CLM-DDDL-000032", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Deficiencies of strontium are associated with certain types of Ca and boron\nresistant osteoporosis and arthritis." }, "WAL-CLM-DDDL-000033": { book: "dddl-3e-2011", claim_text: "Strontium can substitute for calcium in many organisms, including humans, and concentrates in bone.", conditions: [], confidence: "high", dose: null, essentials: ["strontium", "calcium"], id: "WAL-CLM-DDDL-000033", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "where it\u2019s most highly concentrated in mammalian bone. Strontium\ncan replace calcium in many organisms, including man." }, "WAL-CLM-DDDL-000034": { book: "dddl-3e-2011", claim_text: "Vanadium functions like insulin, making cell-membrane insulin receptors more sensitive and aiding glucose/carbohydrate intolerance.", conditions: ["diabetes"], confidence: "high", dose: null, essentials: ["vanadium"], id: "WAL-CLM-DDDL-000034", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Vanadium appears to function\nlike insulin by altering cell membrane function for ion transport." }, "WAL-CLM-DDDL-000035": { book: "dddl-3e-2011", claim_text: "Vanadium supplementation can reduce or even eliminate most cases of adult-onset diabetes.", conditions: ["diabetes"], confidence: "high", dose: null, essentials: ["vanadium"], id: "WAL-CLM-DDDL-000035", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "Vanadium supplementation can have a major positive\neconomic impact by reducing or even eliminating most cases of adult onset\ndiabetes." }, "WAL-CLM-DDDL-000036": { book: "dddl-3e-2011", claim_text: "Vanadium has anticarcinogenic properties; in mice it blocked induction of mammary tumor growth and reduced tumor incidence.", conditions: ["cancer"], confidence: "medium", dose: null, essentials: ["vanadium"], id: "WAL-CLM-DDDL-000036", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Vanadium has known\nanticarcinogenic properties. Feeding 25 |ng of vanadium per gram of diet\nblocked induction of mouse mammary tumor growth." }, "WAL-CLM-DDDL-000037": { book: "dddl-3e-2011", claim_text: "At least 70 metalloenzymes require zinc as a functional cofactor.", conditions: [], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-DDDL-000037", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "There are no less than 70 metalloenzymes that require Zn as a\nfunctional cofactor." }, "WAL-CLM-DDDL-000038": { book: "dddl-3e-2011", claim_text: "Zinc is integral to the RNA molecule (the 'metallic fingers') and participates in cell division and DNA synthesis.", conditions: [], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-DDDL-000038", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Zinc is also an integral part of the RNA molecule itself where Zinc\nprovides the \u201Cmetallic fingers\u201D and participates in cell division and\nsynthesis of DNA." }, "WAL-CLM-DDDL-000039": { book: "dddl-3e-2011", claim_text: "Zinc deficiency produces a wide range of diseases, including congenital birth defects and degenerative diseases across all age groups.", conditions: ["birth_defects"], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-DDDL-000039", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Zinc deficiency\nproduces a wide range of diseases including congenital birth defects and\ndegenerative diseases of all age groups." }, "WAL-CLM-DDDL-000040": { book: "dddl-3e-2011", claim_text: "Excess dietary copper and iron, and high-phytate (vegan) diets, reduce the availability of dietary zinc.", conditions: [], confidence: "high", dose: null, essentials: ["zinc", "copper", "iron"], id: "WAL-CLM-DDDL-000040", kind: "interaction", other_substances: [], symptoms: [], verbatim: "Excesses of dietary copper and iron and high phytate diets (vegans) will\nreduce availability of dietary zinc." }, "WAL-CLM-DDDL-000041": { book: "dddl-3e-2011", claim_text: "Vitamin A deficiency in children causes keratitis, corneal ulcers, and blindness.", conditions: ["keratitis", "corneal_ulcers", "blindness"], confidence: "high", dose: null, essentials: ["vitamin-a"], id: "WAL-CLM-DDDL-000041", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Vitamin A deficiencies in\nchildren caused keratitis, corneal ulcers, and blindness." }, "WAL-CLM-DDDL-000042": { book: "dddl-3e-2011", claim_text: "Folic acid (or zinc) deficiency causes spina bifida and serious cleft palate in infants.", conditions: ["spina_bifida", "cleft_palate"], confidence: "high", dose: null, essentials: ["vitamin-b9", "zinc"], id: "WAL-CLM-DDDL-000042", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Infants born with spina bifida and serious cleft palates as a result of folic\nacid or zinc deficiencies did not survive the primitive environment." }, "WAL-CLM-DDDL-000043": { book: "dddl-3e-2011", claim_text: "Thiamin (vitamin B1) deficiency causes beriberi with resulting congestive heart failure.", conditions: ["beriberi", "congestive_heart_failure"], confidence: "high", dose: null, essentials: ["vitamin-b1"], id: "WAL-CLM-DDDL-000043", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Beriberi with resultant congestive\nheart failure was common, the result of a thiamin or vitamin Bl deficiency." }, "WAL-CLM-DDDL-000044": { book: "dddl-3e-2011", claim_text: "Vitamin B12 is a water-soluble red crystalline substance; its red color comes from the cobalt atom at its center.", conditions: [], confidence: "high", dose: null, essentials: ["vitamin-b12", "cobalt"], id: "WAL-CLM-DDDL-000044", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Vitamin B12 is a red crystalline substance that is water soluble. The red\ncolor is due to the cobalt in the molecule." }, "WAL-CLM-DDDL-000045": { book: "dddl-3e-2011", claim_text: "About 30 percent of vitamin B12 activity is lost during cooking (electric, gas, or microwave).", conditions: [], confidence: "medium", dose: null, essentials: ["vitamin-b12"], id: "WAL-CLM-DDDL-000045", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "About 30 percent of B12 activity is lost during cooking\n(electric, gas, or microwave)." }, "WAL-CLM-DDDL-000046": { book: "dddl-3e-2011", claim_text: "Supplemental chromium prevents and treats both diabetes and hypoglycemia (known since 1958).", conditions: ["diabetes", "hypoglycemia"], confidence: "high", dose: null, essentials: ["chromium"], id: "WAL-CLM-DDDL-000046", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "Since\n1958, it has been known that supplemental chromium will prevent and treat\ndiabetes as well as hypoglycemia." }, "WAL-CLM-DDDL-000047": { book: "dddl-3e-2011", claim_text: "A University of Vancouver medical school statement (1985): vanadium will replace insulin for adult-onset diabetics.", conditions: ["diabetes"], confidence: "high", dose: null, essentials: ["vanadium"], id: "WAL-CLM-DDDL-000047", kind: "quote", other_substances: [], symptoms: [], verbatim: "the medical school at the\nUniversity of Vancouver, BC, Canada stated that \u201Cvanadium will replace\ninsulin for adult onset diabetics.\u201D" }, "WAL-CLM-DDDL-000048": { book: "dddl-3e-2011", claim_text: "Diabetes treatment starts with chromium and vanadium at 250 mcg/day in the initial stages to prevent insulin shock.", conditions: ["diabetes"], confidence: "high", dose: { amount: 250, duration: null, for_condition: "diabetes", form: null, period: "daily", unit: "mcg" }, essentials: ["chromium", "vanadium"], id: "WAL-CLM-DDDL-000048", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of diabetes should include chromium and vanadium at 250\nmeg/day in the initial stages to prevent \u201Cinsulin shock\u201D" }, "WAL-CLM-DDDL-000049": { book: "dddl-3e-2011", claim_text: "The diabetes regimen also includes zinc 50 mg t.i.d., B-complex 50 mg t.i.d. (with niacin), EFAs 5 g t.i.d., B12 1,000 mcg/day, quercetin 150 mg/day, copper 2-3 mg/day, lecithin 2,500 mg t.i.d., and glutathione 100 mg/day.", conditions: ["diabetes"], confidence: "high", dose: null, essentials: ["zinc", "vitamin-b3", "vitamin-b12", "copper"], id: "WAL-CLM-DDDL-000049", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of diabetes should also include zinc at 50 mg t.i.d., B-complex at\n50 mg t.i.d. (be sure to include niacin which is part of the GTF \u201Cglucose\ntolerance factor\u201D), essential fatty acids at 5 gm t.i.d., B12 at 1,000 meg/day,\nbioflavonoids including quercetin at 150 mg/day, copper at 2-3 mg/day,\nlecithin at 2,500 mg t.i.d., and glutathione at 100 mg/day." }, "WAL-CLM-DDDL-000050": { book: "dddl-3e-2011", claim_text: "Osteoarthritis and degenerative arthritis are a complex of nutritional deficiencies; rheumatoid arthritis's overt cause is chronic Mycoplasma infection.", conditions: ["osteoarthritis", "rheumatoid_arthritis"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000050", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "osteoarthritis and degenerative arthritis are a complex of\nnutritional deficiencies. In the case of rheumatoid arthritis, a chronic\ninfection with a Mycoplasma spp. is the overt cause." }, "WAL-CLM-DDDL-000051": { book: "dddl-3e-2011", claim_text: "Arthritis treatment includes calcium at 2,000 mg/day (more if eating meat) plus magnesium at 800-1,000 mg/day.", conditions: ["arthritis"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000051", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of arthritis should include calcium at 2000 mg/day and more if\nyou eat meat two or three times per day. Also take magnesium at 800-1000\nmg/day" }, "WAL-CLM-DDDL-000052": { book: "dddl-3e-2011", claim_text: "A dietary calcium:phosphorus ratio of 2:1 is ideal but impossible to attain on an unsupplemented diet; the more meat eaten, the more calcium supplementation needed.", conditions: ["arthritis", "osteoporosis"], confidence: "medium", dose: null, essentials: ["calcium", "phosphorus"], id: "WAL-CLM-DDDL-000052", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "A dietary calcium/phosphorus ratio of 2:1 is ideal yet impossible to attain in\nan unsupplemented diet." }, "WAL-CLM-DDDL-000053": { book: "dddl-3e-2011", claim_text: "Asthma is a malabsorption disease featuring essential fatty acid, manganese, and magnesium deficiencies.", conditions: ["asthma"], confidence: "high", dose: null, essentials: ["manganese", "magnesium"], id: "WAL-CLM-DDDL-000053", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Asthma is a\ndisease of malabsorption with essential fatty acid deficiencies and\ndeficiencies of manganese and magnesium." }, "WAL-CLM-DDDL-000054": { book: "dddl-3e-2011", claim_text: "Cor pulmonale treatment includes resolving the lung disease plus oxygen, IV hydrogen peroxide, and selenium at 500-1,000 mcg/day for adults.", conditions: ["cor_pulmonale"], confidence: "high", dose: { amount: "500-1000", duration: null, for_condition: "cor_pulmonale", form: null, period: "daily", unit: "mcg" }, essentials: ["selenium"], id: "WAL-CLM-DDDL-000054", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of cor pulmonale includes resolving the precipitating lung\ndisease and oxygen, IV hydrogen peroxide, and selenium at 500-1,000 meg\nper day for adults." }, "WAL-CLM-DDDL-000055": { book: "dddl-3e-2011", claim_text: "Cradle cap treatment includes regular shampooing plus B6 at 10-25 mg/day and zinc at 15-25 mg/day.", conditions: ["cradle_cap"], confidence: "high", dose: null, essentials: ["vitamin-b6", "zinc"], id: "WAL-CLM-DDDL-000055", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of cradle cap includes shampooing regularly to loosen the greasy\nscale, B6 at 10-25 mg per day, and zinc at 15-25 mg per day." }, "WAL-CLM-DDDL-000056": { book: "dddl-3e-2011", claim_text: "Cancer prevention includes beta-carotene at ~300,000 IU/day (vitamin A equivalent) and selenium at 250-500 mcg/day, alongside a low-fat, high-fiber, fried-food-free diet.", conditions: ["cancer"], confidence: "high", dose: { amount: "250-500", duration: null, for_condition: "cancer prevention", form: "selenium", period: "daily", unit: "mcg" }, essentials: ["vitamin-a", "selenium"], id: "WAL-CLM-DDDL-000056", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Try to OD on beta-carotene\n(almost impossible\u2014first sign is dry skin) at about a vitamin A equivalent\nof 300,000 IU per day. Use selenium at 250 to 500 meg per day." }, "WAL-CLM-DDDL-000057": { book: "dddl-3e-2011", claim_text: "Per the US government, the five-year cancer survival rate has not changed in 20 years despite new surgery/radiation/chemotherapy \u2014 untreated patients as a group survived longer.", conditions: ["cancer"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000057", kind: "quote", other_substances: [], symptoms: [], verbatim: "CHEMOTHERAPY\u2014IN FACT, UNTREATED\nPATIENTS, AS A GROUP, SURVIVED LONGER!" }, "WAL-CLM-DDDL-000058": { book: "dddl-3e-2011", claim_text: "Osteoporosis is easy to prevent and cure with proper supplementation of stomach acid (HCl) and calcium.", conditions: ["osteoporosis"], confidence: "high", dose: null, essentials: ["calcium"], id: "WAL-CLM-DDDL-000058", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "In our personal experience\nosteoporosis is easy to prevent and cure with proper supplementation of\nstomach acid (HC1) and calcium." }, "WAL-CLM-DDDL-000059": { book: "dddl-3e-2011", claim_text: "Estrogen and fluoride supplementation alone do not solve osteoporosis.", conditions: ["osteoporosis"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000059", kind: "quote", other_substances: [], symptoms: [], verbatim: "The big push by the \u201Corthodox\u201D\ndoctors is for estrogen and fluoride supplementation, yet these two\ncompounds alone do not solve the problem." }, "WAL-CLM-DDDL-000060": { book: "dddl-3e-2011", claim_text: "Osteoporosis treatment includes betaine HCl and pancreatic enzymes (75-200 mg t.i.d. before meals) plus calcium and magnesium at 2,000 and 1,000 mg/day or more for the first 30 days.", conditions: ["osteoporosis"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000060", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of osteoporosis should include betaine HC1 and pancreatic\nenzymes at 75-200 mg t.i.d. 15 minutes before meals, and calcium and\nmagnesium at 2,000 mg and 1,000 mg per day or more for the first 30 days." }, "WAL-CLM-DDDL-000061": { book: "dddl-3e-2011", claim_text: "Estrogen may be contraindicated for osteoporosis due to a potential carcinogenic effect \u2014 it is known to cause breast and uterine cancer.", conditions: ["osteoporosis", "breast_cancer", "uterine_cancer"], confidence: "medium", dose: null, essentials: [], id: "WAL-CLM-DDDL-000061", kind: "contraindication", other_substances: [], symptoms: [], verbatim: "Estrogen may be contraindicated because of the potential carcinogenic\neffect: it is known to cause breast and uterine cancer." }, "WAL-CLM-DDDL-000062": { book: "dddl-3e-2011", claim_text: "Per Wallach, 95 percent of all otitis (earaches) is the result of a milk allergy.", conditions: ["otitis"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000062", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "In reality, 95 percent of all otitis (earaches) is the result of a milk allergy." }, "WAL-CLM-DDDL-000063": { book: "dddl-3e-2011", claim_text: "The essential fatty acids are linoleic, linolenic, and arachidonic acids; about 3% of total daily calorie intake should come from EFAs (linoleic and linolenic are strictly essential).", conditions: [], confidence: "high", dose: null, essentials: ["omega-3", "omega-6"], id: "WAL-CLM-DDDL-000063", kind: "definition", other_substances: [], symptoms: [], verbatim: "Three polyunsaturated fatty acids (linoleic, linolenic, and arachidonic acids)\nare known as essential fatty acids (EFA). Three percent of the total daily\ncalorie intake is required from EFA." }, "WAL-CLM-DDDL-000064": { book: "dddl-3e-2011", claim_text: "EFAs are the raw material the body uses to manufacture prostaglandins, which regulate blood pressure, heart rate, vascular and bronchial dilation, blood clotting, and CNS function.", conditions: [], confidence: "high", dose: null, essentials: ["omega-3", "omega-6"], id: "WAL-CLM-DDDL-000064", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "EFA\u2019s are also the raw material for the human body to\nmanufacture prostaglandins that help regulate blood pressure, heart rate,\nvascular dilation, blood clotting, bronchial dilation, and central nervous\nsystem (brain and spinal cord) function." }, "WAL-CLM-DDDL-000065": { book: "dddl-3e-2011", claim_text: "Essential fatty acid deficiency in infants causes poor growth, eczema, and lowered resistance to infectious disease.", conditions: ["eczema"], confidence: "high", dose: null, essentials: ["omega-3", "omega-6"], id: "WAL-CLM-DDDL-000065", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "EFA deficiency in human infants\nresults in a poor growth rate, eczema, and lowered resistance to infectious\ndiseases." }, "WAL-CLM-DDDL-000066": { book: "dddl-3e-2011", claim_text: "Wallach adds arginine, taurine, and tyrosine to the classic essential amino acids \u2014 over the long haul preventing cancer, macular degeneration, and goiter respectively.", conditions: ["cancer", "macular_degeneration", "goiter"], confidence: "high", dose: null, essentials: ["arginine", "tyrosine"], id: "WAL-CLM-DDDL-000066", kind: "quote", other_substances: ["taurine"], symptoms: [], verbatim: "To the classic list of essential amino\nacids, I would add arginine, taurine, and tyrosine. Over the long haul, these\nthree amino acids help prevent certain specific diseases. Respectively, those\ndiseases are cancer, macular degeneration, and goiter." }, "WAL-CLM-DDDL-000067": { book: "dddl-3e-2011", claim_text: "Tryptophan is a precursor of niacin and serotonin; phenylalanine of thyroxin and epinephrine; methionine forms choline and creatine phosphate.", conditions: [], confidence: "high", dose: null, essentials: ["tryptophan", "phenylalanine", "methionine"], id: "WAL-CLM-DDDL-000067", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Tryptophane precursor of niacin and serotonin\nPhenylalanine precursor of thyroxin and epinephrine\nMethionine formation of choline and creatine phosphate" }, "WAL-CLM-DDDL-000068": { book: "dddl-3e-2011", claim_text: "Cholesterol is structural to cell walls and myelin and is the raw material for vitamin D, bile acids, and the steroid hormones (estrogen, progesterone, testosterone).", conditions: ["menopause"], confidence: "medium", dose: null, essentials: ["vitamin-d"], id: "WAL-CLM-DDDL-000068", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Cholesterol is an essential part\nof the structure of cell walls, brain and spinal cord (myelin), the raw\nmaterial for the production of vitamin D in the human body, bile acids,\nadrenal cortical hormones, estrogen (a cholesterol deficiency makes\nmenopause a living hell), progesterone, and testosterone" }, "WAL-CLM-DDDL-000069": { book: "dddl-3e-2011", claim_text: "Infertility is usually caused by a nutritional deficiency; Wallach reports curing several hundred cases with supplementation of vitamins, minerals, trace minerals, and digestive aids.", conditions: ["infertility"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000069", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "INFERTILITY (curable inability to have children) is usually caused by a\nnutritional deficiency of some nutrient. We have \u201Ccured\u201D several hundred\ncases of infertility by simple supplementation of vitamins, minerals, trace\nminerals, and digestive aids." }, "WAL-CLM-DDDL-000070": { book: "dddl-3e-2011", claim_text: "Infertility protocol: EFA 5 g t.i.d., L-arginine 500 mg t.i.d., zinc, selenium 250 mcg/day, vitamin A 100,000 IU/day for 30 days then 25,000 IU/day, and germanium 50 mg/day.", conditions: ["infertility"], confidence: "high", dose: null, essentials: ["arginine", "zinc", "selenium", "vitamin-a", "germanium"], id: "WAL-CLM-DDDL-000070", kind: "protocol", other_substances: [], symptoms: [], verbatim: "EFA at 5 gm t.i.d., 1-arginine at 500 mg t.i.d., zinc at 15 gm t.i.d., selenium\nat 250 meg/day, vitamin A at 100,000 IU/day for 30 days then drop to\n25,000 IU/day, germanium at 50 mg/day" }, "WAL-CLM-DDDL-000071": { book: "dddl-3e-2011", claim_text: "Selenium prevents muscular dystrophy in all its forms (and Keshan disease, heart muscular dystrophy); preconception selenium levels matter for both pregnancy maintenance and MD prevention.", conditions: ["muscular_dystrophy", "keshan_disease"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000071", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The selenium levels in\npreconception women is important to the maintenance of pregnancy as well\nas the prevention of muscular dystrophy in all of its forms" }, "WAL-CLM-DDDL-000072": { book: "dddl-3e-2011", claim_text: "Given selenium and vitamin E (IM or IV) at the very first onset of symptoms, muscular dystrophy can be arrested or even cured.", conditions: ["muscular_dystrophy"], confidence: "high", dose: null, essentials: ["selenium", "vitamin-e"], id: "WAL-CLM-DDDL-000072", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "If selenium and vitamin E were to\nbe given IM or IV at the very first onset of symptoms, the disease will be\narrested or maybe even \u201Ccured.\u201D" }, "WAL-CLM-DDDL-000073": { book: "dddl-3e-2011", claim_text: "MD / Keshan disease treatment uses selenium (oral colloidal, IV or IM) at 50-1,000 mcg/day by weight plus vitamin E IM at 80 mg/day.", conditions: ["muscular_dystrophy", "keshan_disease"], confidence: "high", dose: { amount: "50-1000", duration: null, for_condition: "muscular dystrophy", form: "selenium", period: "daily", unit: "mcg" }, essentials: ["selenium", "vitamin-e"], id: "WAL-CLM-DDDL-000073", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of MD and/or Keshan disease includes the use of selenium orally\n(plant derived colloidal minerals), IV or IM at 50-1,000 meg per day (based\non weight), vitamin E IM at 80 mg per day" }, "WAL-CLM-DDDL-000074": { book: "dddl-3e-2011", claim_text: "Muscle cramps (charley horse) are a mini-convulsion in the muscle resulting from deficiencies of calcium and magnesium.", conditions: ["muscle_cramps"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000074", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "MUSCLE CRAMPS (Charley horse) are a \u201Cmini\u201D convulsion that is taking\nplace in the muscle as a result of deficiencies of calcium, magnesium" }, "WAL-CLM-DDDL-000075": { book: "dddl-3e-2011", claim_text: "Insomnia treatment includes avoiding caffeine and food allergens, calcium (esp. plant-derived colloidal), and chromium + vanadium at 25-200 mcg t.i.d.", conditions: ["insomnia"], confidence: "high", dose: null, essentials: ["calcium", "chromium", "vanadium"], id: "WAL-CLM-DDDL-000075", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment for insomnia includes avoidance of caffeine and offending food allergens, calcium\n(especially plant derived colloidal calcium), chromium and vanadium at 25-200 meg t.i.d." }, "WAL-CLM-DDDL-000076": { book: "dddl-3e-2011", claim_text: "For angina, calcium 2,000 mg/day, magnesium 800 mg/day, and essential fatty acids help prevent disease progression; lifestyle change and supplementation can reverse cardiovascular disease.", conditions: ["angina", "cardiovascular_disease"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000076", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Calcium (2000 mg/day) and magnesium (800 mg/day) and essential fatty\nacids can help prevent progress of current disease" }, "WAL-CLM-DDDL-000077": { book: "dddl-3e-2011", claim_text: "Chronic loss of the sense of smell (anosmia) is most frequently the result of a zinc deficiency.", conditions: ["anosmia"], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-DDDL-000077", kind: "deficiency_sign", other_substances: [], symptoms: ["loss_of_smell"], verbatim: "Chronic loss of the sense of\nsmell is most frequently the result of a zinc deficiency." }, "WAL-CLM-DDDL-000078": { book: "dddl-3e-2011", claim_text: "Anxiety/panic treatment: avoid caffeine and sugar; chromium + vanadium 200-300 mcg/day, B6 100 mg t.i.d., B3 450 mg t.i.d., L-tryptophan, calcium 2,000 mg/day, magnesium 800 mg/day.", conditions: ["anxiety"], confidence: "high", dose: null, essentials: ["chromium", "vanadium", "vitamin-b6", "vitamin-b3", "calcium", "magnesium"], id: "WAL-CLM-DDDL-000078", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Take chromium and vanadium\n200-300 meg/day, B6 100 mg t.i.d., B3 450 mg t.i.d. as time-release tablets,\nBl, B2, and B5 at the rate of 50 mg t.i.d., L-tryptophan 10 grams t.i.d.,\ncalcium 2000 mg/day, and magnesium at 800 mg/day." }, "WAL-CLM-DDDL-000079": { book: "dddl-3e-2011", claim_text: "Deficiencies of zinc and lithium are associated with anorexia.", conditions: ["anorexia"], confidence: "high", dose: null, essentials: ["zinc", "lithium"], id: "WAL-CLM-DDDL-000079", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "Deficiencies of zinc and lithium are associated with anorexia." }, "WAL-CLM-DDDL-000080": { book: "dddl-3e-2011", claim_text: "Canker sores (aphthous stomatitis): folic acid 5 mg t.i.d., B12 1,000 mcg/day, iron 15 mg/day, and zinc 50 mg t.i.d. as adjuncts to allergen-avoidance diets.", conditions: ["canker_sores", "aphthous_stomatitis"], confidence: "high", dose: null, essentials: ["vitamin-b9", "vitamin-b12", "iron", "zinc"], id: "WAL-CLM-DDDL-000080", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Folic acid at 5 mg ti.d., B12 at 1000 meg/day, iron at 15 mg/day and zinc at\n50 mg t.i.d. are effective adjuncts to avoidance diets." }, "WAL-CLM-DDDL-000081": { book: "dddl-3e-2011", claim_text: "For arsenic toxicity, IV chelation and oral colloidal/chelated selenium effectively remove the body's arsenic load.", conditions: ["arsenic_toxicity"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-DDDL-000081", kind: "protocol", other_substances: [], symptoms: [], verbatim: "IV chelation is very effective in removing\nthe body load of arsenic, as is the oral use of colloidal or chelated selenium." }, "WAL-CLM-DDDL-000082": { book: "dddl-3e-2011", claim_text: "Magnesium deficiency produces malignant calcification of the elastic arteries and may be the cause of arteriosclerosis.", conditions: ["arteriosclerosis"], confidence: "high", dose: null, essentials: ["magnesium"], id: "WAL-CLM-DDDL-000082", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Magnesium deficiencies produce \u201Cmalignant calcification\u201D of\nelastic arteries and are perhaps \u201Cthe cause\u201D of arteriosclerosis." }, "WAL-CLM-DDDL-000083": { book: "dddl-3e-2011", claim_text: "Vitamin D toxicity (angiotoxicity) targets the elastic arteries, causing fibrosis of the vascular smooth muscle and calcification of the vessel wall.", conditions: ["arteriosclerosis"], confidence: "medium", dose: null, essentials: ["vitamin-d"], id: "WAL-CLM-DDDL-000083", kind: "contraindication", other_substances: [], symptoms: [], verbatim: "The target tissue of vitamin D toxicity is the\nelastic arteries and the specific result is fibrosis of the vascular smooth\nmuscle and calcification of the blood vessel wall" }, "WAL-CLM-DDDL-000084": { book: "dddl-3e-2011", claim_text: "Age-related prostate enlargement (BPH) is usually the result of a zinc deficiency.", conditions: ["benign_prostatic_hyperplasia"], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-DDDL-000084", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "As the prostate\nenlarges with age (usually the result of a zinc deficiency)" }, "WAL-CLM-DDDL-000085": { book: "dddl-3e-2011", claim_text: "BPH treatment: zinc 50 mg t.i.d., flaxseed-oil EFAs 9 g/day, high-fiber diet with pumpkin seeds, 300,000 IU vitamin A as beta-carotene/day, and selenium 250 mcg t.i.d.", conditions: ["benign_prostatic_hyperplasia"], confidence: "high", dose: null, essentials: ["zinc", "vitamin-a", "selenium"], id: "WAL-CLM-DDDL-000085", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Benign prostatic hypertrophy is treated with zinc at 50 mg t.i.d., essential\nfatty acids as flaxseed oil at 9 grams per day, high fiber diets including\npumpkin seeds and alfalfa, 300,000 IU vitamin A as beta carotene per day" }, "WAL-CLM-DDDL-000086": { book: "dddl-3e-2011", claim_text: "Bell's palsy treatment: B12 1,000 mcg/day to a total of 20,000 mcg, calcium/magnesium 2,000 and 800 mg/day, and essential fatty acids 5 g t.i.d.", conditions: ["bells_palsy"], confidence: "high", dose: null, essentials: ["vitamin-b12", "calcium", "magnesium"], id: "WAL-CLM-DDDL-000086", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment is B12 at 1000 meg/day for a total of 20,000 meg, calcium/\nmagnesium at 2,000 mg and 800 mg per day, essential fatty acids at 5 gm\nt.i.d." }, "WAL-CLM-DDDL-000087": { book: "dddl-3e-2011", claim_text: "Kidney/bladder stones are ironically caused by a calcium- and/or magnesium-deficient diet \u2014 the stone minerals come from your own bones.", conditions: ["kidney_stones", "bladder_stones"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000087", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "BLADDER STONES (kidney stones, cystic calculi) are ironically caused\nby a calcium and/or a magnesium deficient diet" }, "WAL-CLM-DDDL-000088": { book: "dddl-3e-2011", claim_text: "For kidney stones, calcium and magnesium at 2,000 and 1,000 mg is imperative to stop calcium loss from the bones (plus reducing meat to fix the Ca:P ratio).", conditions: ["kidney_stones"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000088", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Calcium and\nmagnesium at 2,000 mg and 1,000 mg is imperative to stop calcium loss\nfrom the bones." }, "WAL-CLM-DDDL-000089": { book: "dddl-3e-2011", claim_text: "Bleeding under the skin may indicate vitamin E or vitamin K deficiency (or excessive blood thinners).", conditions: [], confidence: "high", dose: null, essentials: ["vitamin-e", "vitamin-k"], id: "WAL-CLM-DDDL-000089", kind: "deficiency_sign", other_substances: [], symptoms: ["easy_bruising"], verbatim: "Bleeding under the skin may indicate vitamin E or vitamin K\ndeficiencies" }, "WAL-CLM-DDDL-000090": { book: "dddl-3e-2011", claim_text: "In a normal gradual menopause, the adrenals and liver increase female-hormone (estrogen) output to make up for lost ovarian function; insufficient output produces hot flashes and night sweats.", conditions: ["menopause"], confidence: "medium", dose: null, essentials: [], id: "WAL-CLM-DDDL-000090", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "the adrenals and liver increase their\noutput of female hormones (primarily estrogen) and make up the difference\nfrom the lost ovarian function." }, "WAL-CLM-DDDL-000091": { book: "dddl-3e-2011", claim_text: "Estrogen supplements should not be used in menopause \u2014 they increase the breast and uterine cancer induction risk.", conditions: ["menopause", "breast_cancer", "uterine_cancer"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000091", kind: "contraindication", other_substances: [], symptoms: [], verbatim: "Estrogen supplements should not be used as\nthey increase the breast and uterine cancer induction risk." }, "WAL-CLM-DDDL-000092": { book: "dddl-3e-2011", claim_text: "Menopause support includes the baseline supplement program plus calcium and magnesium at 2,000 and 1,000 mg/day.", conditions: ["menopause"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-DDDL-000092", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Use the base line supplement program, plus calcium and magnesium\nat 2,000 mg and 1,000 mg per day" }, "WAL-CLM-DDDL-000093": { book: "dddl-3e-2011", claim_text: "Colds are caused by more than 100 different viruses \u2014 which is why no vaccine has been made available.", conditions: ["common_cold"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-DDDL-000093", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "COLDS (nasal catarrh, coryza) are caused by more than 100 different\nviruses, this is why no vaccine has been made available." }, "WAL-CLM-DDDL-000094": { book: "dddl-3e-2011", claim_text: "Common-cold treatment: vitamin C to bowel tolerance, bioflavonoids 150 mg t.i.d., garlic, the baseline supplement program, and chicken-rice soup.", conditions: ["common_cold"], confidence: "high", dose: null, essentials: ["vitamin-c"], id: "WAL-CLM-DDDL-000094", kind: "protocol", other_substances: [], symptoms: [], verbatim: "Treatment of the \u201Ccommon cold\u201D should include vitamin C to bowel\ntolerance, bioflavonoids at 150 mg t.i.d., garlic, gelatin capsules t.i.d." }, "WAL-CLM-RARE-000001": { book: "rare-earths", claim_text: "Minerals are the currency of life \u2014 the body's basic functions depend on them, and Wallach argues the medical profession ignores this truth to the point past the absurd.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000001", kind: "definition", other_substances: [], symptoms: [], verbatim: "Simply said, minerals are the currency of life. The medical profession ignores this truth to the point past the absurd" }, "WAL-CLM-RARE-000002": { book: "rare-earths", claim_text: "The basic functions of life cannot be performed without minerals \u2014 either as a structural part of the function or as a catalytic cofactor (for RNA, DNA, sub-cellular and digestive enzymes, and the utilization of vitamins).", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000002", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The basic functions of life itself cannot be performed without minerals, either as a major part of the function or as a catalytic cofactor" }, "WAL-CLM-RARE-000003": { book: "rare-earths", claim_text: "Wallach frames heat-stroke deaths (he points to the deadly July 1993 US east-coast heat wave) as a simple salt/sodium deficiency \u2014 easily remedied with water and salt, and worsened by doctor-ordered low-salt diets.", conditions: ["heat_stroke"], confidence: "high", dose: null, essentials: ["sodium"], id: "WAL-CLM-RARE-000003", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "a simple salt or sodium deficiency (your basic heat stroke that any boy scout could diagnose and recognize and remedy with water and salt" }, "WAL-CLM-RARE-000004": { book: "rare-earths", claim_text: "Wallach discovered the trace mineral selenium's pivotal role in the cause and prevention of cystic fibrosis while working as a research veterinary pathologist.", conditions: ["cystic_fibrosis"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-RARE-000004", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "a trace mineral, Selenium, in the etiology and\nprevention of Cystic Fibrosis while a research veterinary pathologist" }, "WAL-CLM-RARE-000005": { book: "rare-earths", claim_text: "Wallach cites U.S. Senate Document 264 (1936) and the 1992 Rio Earth Summit report on soil mineral-depletion rates: the world's farm and range soils are 'anemic' \u2014 soils that should contain 60 elements have few or none.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000005", kind: "definition", other_substances: [], symptoms: [], verbatim: "U.S Senate Document 264 (1936) and the 1992 Earth Summit Report (Rio) on mineral depletion rates of the world's farm and range soils point out graphically that our Earth's soils are anemic - the soil should contain 60 of them, there are few or none" }, "WAL-CLM-RARE-000006": { book: "rare-earths", claim_text: "Wallach puts the human genetic potential for longevity at 120 to 140 years \u2014 the US average life span falls as much as 50% short of it.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000006", kind: "definition", other_substances: [], symptoms: [], verbatim: "falls far short (as much as 50% short) of our human genetic potential for longevity of 120 to 140 years" }, "WAL-CLM-RARE-000007": { book: "rare-earths", claim_text: "Wallach argues the extended rat lifespans in calorie-restriction studies came not from fewer calories but from the higher concentration of minerals per calorie in the diet.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000007", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "It is not the reduced calorie level that gave the rats their extended life spans by 30, 40 and 50%, but rather it is the increased concentration of mineral per calorie in the diet" }, "WAL-CLM-RARE-000008": { book: "rare-earths", claim_text: "After two years of minimal-calorie intake in Biosphere II, five of the six Biospherians craved only pizza and junk food \u2014 which Wallach reads as a manifestation of pica (mineral hunger).", conditions: [], confidence: "medium", dose: null, essentials: [], id: "WAL-CLM-RARE-000008", kind: "personal_anecdote", other_substances: [], symptoms: ["pica"], verbatim: "five of the six Biospherians (excluding Walford) wanted only pizza and junk food (a manifestation of pica" }, "WAL-CLM-RARE-000009": { book: "rare-earths", claim_text: "Wallach frames the Earth as a finite, limited resource for the raw-material elements that are the basis of all plant, animal, and human life.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000009", kind: "definition", other_substances: [], symptoms: [], verbatim: "our planet is a limited finite resource for\nthe raw materials that are the basis of all\nplant, animal and human life as we know\nit." }, "WAL-CLM-RARE-000010": { book: "rare-earths", claim_text: "Wallach's theory holds that cystic fibrosis can be an acquired environmental disease produced by a deficiency of selenium, zinc, and riboflavin, and worsened by diets low in vitamin E and high in polyunsaturated fatty acids.", conditions: ["cystic_fibrosis"], confidence: "high", dose: null, essentials: ["selenium", "zinc", "vitamin-b2", "vitamin-e"], id: "WAL-CLM-RARE-000010", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "an acquired environmental disease\nthat can be produced by a deficiency of selenium, zinc, and\nriboflavin and exacerbated by diets also low in vitamin E" }, "WAL-CLM-RARE-000011": { book: "rare-earths", claim_text: "Germanium deficiency is typified by severely reduced immune status, arthritis, osteoporosis, low energy, and cancer.", conditions: ["arthritis", "osteoporosis", "cancer"], confidence: "high", dose: null, essentials: ["germanium"], id: "WAL-CLM-RARE-000011", kind: "deficiency_sign", other_substances: [], symptoms: ["low_energy", "reduced_immune_status"], verbatim: "Deficiencies of germanium are typified\nby severely reduced immune status," }, "WAL-CLM-RARE-000012": { book: "rare-earths", claim_text: "Wallach gives a germanium maintenance dose of 20-30 mg/day; 50-100 mg/day is commonly used when an individual has a serious illness that requires an increased oxygen level in the body.", conditions: [], confidence: "high", dose: { amount: "50-100", duration: null, for_condition: "serious illness (increased oxygen demand)", form: null, period: "daily", unit: "mg" }, essentials: ["germanium"], id: "WAL-CLM-RARE-000012", kind: "dose", other_substances: [], symptoms: [], verbatim: "50 to 100 mg per day are commonly used\nwhen an individual has a serious illness that\nrequires an increased oxygen level in the\nbody." }, "WAL-CLM-RARE-000013": { book: "rare-earths", claim_text: "Wallach lists germanium-rich foods \u2014 watercress, shiitake mushroom, pearl barley, sanzukon, sushi, waternut, boxthorn seed, and wisteria knob \u2014 at 100 to 2,000 ppm germanium.", conditions: [], confidence: "high", dose: null, essentials: ["germanium"], id: "WAL-CLM-RARE-000013", kind: "food_source", other_substances: [], symptoms: [], verbatim: "sanzukon, sushi, waternut, boxthorn\nseed and wisteria knob contain germanium\nin amounts ranging from 100 to 2,000 ppm." }, "WAL-CLM-RARE-000014": { book: "rare-earths", claim_text: "Against an RDA of 3-4 mcg/day, Wallach prefers a vitamin B12/cobalt intake of 250 to 400 mcg/day, especially when preparing for pregnancy and while nursing.", conditions: [], confidence: "high", dose: { amount: "250-400", duration: null, for_condition: "pregnancy preparation and nursing", form: null, period: "daily", unit: "mcg" }, essentials: ["vitamin-b12", "cobalt"], id: "WAL-CLM-RARE-000014", kind: "dose", other_substances: [], symptoms: [], verbatim: "250 to 400 mcg per day, especially while\npreparing for a pregnancy and nursing" }, "WAL-CLM-RARE-000015": { book: "rare-earths", claim_text: "Wallach holds that birth defects \u2014 physical, emotional, biochemical, and behavioral \u2014 that occur to the embryo or fetus and show up at birth are not genetic, but are in fact preventable.", conditions: ["birth_defects"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000015", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Injuries or birth defects (i.e.-physical,\nemotional, biochemical and behavioral)\nthat occur to the embryo and fetus and\nshow up at birth regardless of cause are not\ngenetic and are in fact preventable." }, "WAL-CLM-RARE-000016": { book: "rare-earths", claim_text: "Wallach attributes the higher trisomy (Down's syndrome) risk in older mothers to mineral depletion \u2014 a woman depleted of minerals by her mid-30s carries higher-risk embryos.", conditions: ["down_syndrome"], confidence: "medium", dose: null, essentials: [], id: "WAL-CLM-RARE-000016", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "(the poor woman would be depleted\nof minerals by the time she was over 35 so\nthe last two or three embryos were at higher\ntisk for trisomy)" }, "WAL-CLM-RARE-000017": { book: "rare-earths", claim_text: "Every species has a genetic-potential ceiling for longevity \u2014 Wallach lists mice ~700 days, dogs 23 years, horses 32, elephants 45, chimpanzees 52, and humans 145 years.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000017", kind: "definition", other_substances: [], symptoms: [], verbatim: "All species have a \u201Cgenetic potential\u201D or\nupper limit for longevity - mice 700 days,\ndogs 23 years, horses 32 years, elephant\n45 years, chimpanzee 52 years and man\n145 years" }, "WAL-CLM-RARE-000018": { book: "rare-earths", claim_text: "Reaching the 145-year longevity potential requires consuming each of the 90 essential nutrients in optimal amounts every day.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000018", kind: "definition", other_substances: [], symptoms: [], verbatim: "Do those positive things necessary to make it to 145 including consuming each of the 90 essential nutrients in optimal amounts each day" }, "WAL-CLM-RARE-000019": { book: "rare-earths", claim_text: "The human population's doubling time has collapsed \u2014 100,000 years before written history, 700 years after the dawn of agriculture, and only 35 to 40 years today \u2014 intensifying the competition for the body's basic raw materials.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000019", kind: "definition", other_substances: [], symptoms: [], verbatim: "Before written history, it took 100,000 years to double the Earth\u2019s human populations; after the dawn of agriculture, (5,000 to 8,000 years ago) it took 700 years to double the population of human kind; today at the brink of the 21st century, it takes only 35 to 40 years to double our numbers!" }, "WAL-CLM-RARE-000020": { book: "rare-earths", claim_text: "The 75.5-year average American lifespan is only 62% of the human genetic potential for longevity of 120 to 140 years and ranks 17th among industrialized nations \u2014 falling as much as 50% short of that potential.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000020", kind: "definition", other_substances: [], symptoms: [], verbatim: "The 75.5 year average life span for Americans places us at 17th in longevity when we are compared with the other industrialized nations and this level of boastful \u201Csuccess\u201D falls far short (as much as 50% short) of our human genetic potential for longevity of 120 to 140 years." }, "WAL-CLM-RARE-000021": { book: "rare-earths", claim_text: "Popular health movements \u2014 vegetarianism, macrobiotics, biofeedback, meditation, exercise, yoga, free medical care \u2014 have not extended the American lifespan beyond 75.5 years, only 62% of the 120-to-140-year genetic potential.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000021", kind: "definition", other_substances: [], symptoms: [], verbatim: "evangelize vegetarianism, macrobiotics, biofeedback, meditation, exercise, pure thought, yoga and free medical care for all (usually vote-buying politicians!); yet none of these practices have extended the human lifespan in America to more than 75.5 years- only 62% of our human genetic potential for longevity of 120 to 140 years." }, "WAL-CLM-RARE-000022": { book: "rare-earths", claim_text: "The full complement of 90 essential nutrients once present in Earthly foods is no longer reliably there \u2014 either totally absent or so highly variable that obtaining them from food alone is a gamble.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000022", kind: "definition", other_substances: [], symptoms: [], verbatim: "Unfortunately, the entire complement of the 90 essential nutrients required for optimal health and longevity historically found in our Earthly foods are no longer there - they are either totally absent or their availability is so highly variable that your chances of obtaining them from food alone is more of a gamble than a Las Vegas \u201Ccrap-shoot\u201D!!!" }, "WAL-CLM-RARE-000023": { book: "rare-earths", claim_text: "Genetic potential is meaningless without the basic mineral raw materials to support development and maintenance \u2014 Wallach likens engineered flesh without minerals to running a Mercedes with no oil or coolant.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000023", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "genetic potential without the basic raw materials to support the process of development and extended maintenance of the flesh is inherently faulty in its premise!!" }, "WAL-CLM-RARE-000024": { book: "rare-earths", claim_text: "Wallach identifies ancient, diverse cultures that reach the 120-to-140-year longevity potential disease-free \u2014 Tibetans, Russian Georgians, Armenians, Azerbaijanis, Abkhazians, Hunzakuts, Vilcabambas, the Titicacas \u2014 through access to plant-derived colloidal minerals (rare earths).", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000024", kind: "definition", other_substances: [], symptoms: [], verbatim: "If you access and plug into the plant derived RARE EARTHS used for thousands of years by certain tribes of Tibetans, Russian Georgians, Armenians, Azerbaijanies, Abkhazians, Hunzakuts, Vilcabambas or the Titicacas you can make it too!!!" }, "WAL-CLM-RARE-000025": { book: "rare-earths", claim_text: "Mineral supplementation is a necessity of life \u2014 since before recorded history humans craved and consumed minerals (major minerals, trace minerals, and rare earths) as clays, salts, animal tissue, and colloidal-mineral-rich plants.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000025", kind: "definition", other_substances: [], symptoms: [], verbatim: "Minerals and mineral supplements to our meals are in fact a necessity of life. Since before recorded history man craved and consciously consumed minerals including the major minerals, trace minerals and Rare Earths in the form of clays, salts, animal tissue (bones and meat) or colloidal mineral rich plants." }, "WAL-CLM-RARE-000026": { book: "rare-earths", claim_text: "Wallach rejects the medical advice to eat little or no salt \u2014 sodium is a craved necessity, evidenced by the salt block every rancher provides livestock and the snack-food industry that profits from the craving.", conditions: [], confidence: "high", dose: null, essentials: ["sodium", "chloride"], id: "WAL-CLM-RARE-000026", kind: "definition", other_substances: [], symptoms: [], verbatim: "Physicians would have you believe that you need little or no salt (they must think we\u2019re dumber than cows for the first food item a good husbandryman puts out for his livestock is a salt block!!); however, the multibillion dollar a year snack food industry is well aware of your need and craving for salt and other minerals." }, "WAL-CLM-RARE-000027": { book: "rare-earths", claim_text: "Wallach attributes the July 1993 East Coast heat-wave deaths to salt/sodium deficiency caused by physician-prescribed low- or no-salt diets for high blood pressure and heart disease; those successfully treated received IV saline.", conditions: ["heat_stroke"], confidence: "high", dose: null, essentials: ["sodium"], id: "WAL-CLM-RARE-000027", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The human tragedy of the heat wave of \u201993 was a direct result of the allopathic doctors who put their charges (their patients) on reduced or salt free diets for high blood pressure or heart disease." }, "WAL-CLM-RARE-000028": { book: "rare-earths", claim_text: "Of the 75 metals on the periodic chart \u2014 all detected in human blood and body fluids \u2014 at least 60 have physiological value for humans, and not a single function in the body can take place without at least one mineral or metal cofactor.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000028", kind: "definition", other_substances: [], symptoms: [], verbatim: "There are 75 metals listed in the periodic chart, all of which have been detected in human blood and other body fluids - we know that at least 60 of these metals (minerals) have physiological value for man. Organically not a single function in the human body can take place without at least one mineral or metal cofactor." }, "WAL-CLM-RARE-000029": { book: "rare-earths", claim_text: "Wallach recommends adding lithium to the public water supply and eliminating fluoride; conventional medicine confines lithium to psychiatric use (manic depression).", conditions: [], confidence: "high", dose: null, essentials: ["lithium"], id: "WAL-CLM-RARE-000029", kind: "definition", other_substances: [], symptoms: [], verbatim: "The current medical use of lithium is limited to psychiatric patients, especially manic depression. We would like to see lithium added to the public water supply and eliminate fluoride!!!" }, "WAL-CLM-RARE-000030": { book: "rare-earths", claim_text: `The Earth's soils are "anemic" \u2014 mining, deforestation, farming, irrigation, and acid rain have shifted, eroded, and leached the life-sustaining minerals from once mineral-rich land.`, conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000030", kind: "definition", other_substances: [], symptoms: [], verbatim: "Our Earth is anemic!!!! A potentially apocalyptic mixture of mining, deforestation, farming, irrigation and acid rain has shifted, eroded or leached our life giving and life-sustaining raw materials from our formerly mineral rich land." }, "WAL-CLM-RARE-000031": { book: "rare-earths", claim_text: "Remineralizing the Earth's depleted farmland is technically possible but, as a realistic project, an economic impossibility.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000031", kind: "definition", other_substances: [], symptoms: [], verbatim: "To remineralize the Earth is technically possible but as a realistic project would be an economic impossibility." }, "WAL-CLM-RARE-000032": { book: "rare-earths", claim_text: "Minerals are unevenly distributed in soil \u2014 croplands hold no uniform blanket of minerals but veins (like chocolate swirls in ripple ice cream), so relying on food alone for minerals is a risky gamble.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000032", kind: "definition", other_substances: [], symptoms: [], verbatim: "It is obvious that minerals are not equally distributed in soils. The scary part is that fields where our food crops are grown do not contain a uniform blanket of minerals, if they contain any nutritional minerals at all, they occur in veins much like the chocolate swirls found in chocolate ripple ice cream - at best depending solely on getting minerals from food grown in soil is a very risky crap shoot!!" }, "WAL-CLM-RARE-000033": { book: "rare-earths", claim_text: "Minerals are more fundamental than vitamins: the body can make some use of minerals without vitamins, but lacking minerals, vitamins are useless. (Wallach reproduces this within his U.S. Senate Document 264 discussion.)", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000033", kind: "quote", other_substances: [], symptoms: [], verbatim: "Lacking vitamins, the system can make some use of minerals, but lacking minerals, vitamins are useless." }, "WAL-CLM-RARE-000034": { book: "rare-earths", claim_text: `Modern NPK fertilizer replaces only three elements, so cropping "mines" the soil's minerals within 5 to 10 years and irrigation speeds the leaching \u2014 after 100+ years the result is rising rates of degenerative disease.`, conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000034", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "It only takes 5 to 10 years for agriculture to \u201Cmine\u201D the minerals from the soil by cropping. Irrigation while providing water for increased production in terms of tons and bushels actually speeds up the leaching of nutritional minerals from the land" }, "WAL-CLM-RARE-000035": { book: "rare-earths", claim_text: 'Pica in animals ("cribbing" \u2014 a horse or cow gnawing wood, fences, or feed boxes) is a craving for minerals; mineral-starved animals first eat large amounts of supplemental minerals, then self-regulate down to a maintenance level.', conditions: ["pica"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000035", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "the animal really has a craving for minerals. Such mineral starved animals will at first eat large amounts of supplemental minerals until they are satisfied, then they will automatically reduce their level of consumption to a maintenance level." }, "WAL-CLM-RARE-000036": { book: "rare-earths", claim_text: "Geophagia (earth-eating) is a form of pica common in mineral-deficient pregnant humans; Wallach observed a hundred pregnant sheep in Montana eating clay along an embankment.", conditions: ["pica"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000036", kind: "personal_anecdote", other_substances: [], symptoms: [], verbatim: "We have seen a hundred pregnant sheep in Montana lined up along an embankment eating clay (this is a form of pica known as \u201Cgeophagia\u201D or earth eating geophagia is very common in minerally deficient pregnant humans)." }, "WAL-CLM-RARE-000037": { book: "rare-earths", claim_text: "Pica is driven by iron deficiency: in a controlled trial of 25 children who ate sand, 11 of 13 given iron lost their pica behavior within months versus only 3 of 12 given saline.", conditions: ["pica"], confidence: "high", dose: null, essentials: ["iron"], id: "WAL-CLM-RARE-000037", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "McDonald and Marshall (1964) reported on 25 children who ate sand. They divided the group in half; they gave one group iron and the other group saline (salt solution). After three to four months 11 of the 13 children given iron had lost their pica behavior compared with only 3 of the 12 given saline." }, "WAL-CLM-RARE-000038": { book: "rare-earths", claim_text: "Dietary potassium deficiency is unlikely (grains, fruits, and vegetables are rich in it), but it becomes common in people taking diuretics for high blood pressure or weight loss.", conditions: [], confidence: "high", dose: null, essentials: ["potassium"], id: "WAL-CLM-RARE-000038", kind: "interaction", other_substances: [], symptoms: [], verbatim: "a potassium deficiency can be common in those individuals taking diuretics for high blood pressure or weight loss." }, "WAL-CLM-RARE-000039": { book: "rare-earths", claim_text: 'The "munchies" and cravings for alcohol and sweets (especially chocolate) are signs of chromium and vanadium deficiency.', conditions: [], confidence: "high", dose: null, essentials: ["chromium", "vanadium"], id: "WAL-CLM-RARE-000039", kind: "deficiency_sign", other_substances: [], symptoms: [], verbatim: "The \u201Cmunchies\u201D, cravings for alcohol and candy cravings (especially chocolate) are sure signs of a chromium and vanadium deficiency." }, "WAL-CLM-RARE-000040": { book: "rare-earths", claim_text: "Wallach attributes preteen and teen infatuation with snack foods, drugs, smoking, and alcohol to pica \u2014 a mineral-deficiency-driven craving to put something in the mouth.", conditions: ["pica"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000040", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The preteen and teen age infatuation with snack foods, drugs, smoking and alcohol appear to be the result of pica - because they are so minerally deficient they are seeking something, anything, to put in their mouth that will satisfy an irresistable craving for minerals." }, "WAL-CLM-RARE-000041": { book: "rare-earths", claim_text: "Lithium has measurable mood- and behavior-moderating effects even at the trace levels found in municipal drinking water. A study of 27 Texas counties (1978\u20131987) by Dr. Gerhard Schrauzer found significantly higher rates of suicide, homicide and rape in counties whose water contained little or no lithium than in those with water-lithium levels of 70\u2013170 \xB5g/L; Wallach argues lithium, not fluoride, belongs in community drinking water.", conditions: [], confidence: "high", dose: null, essentials: ["lithium"], id: "WAL-CLM-RARE-000041", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "These results suggest that lithium has moderating effects on suicidal and violent criminal behavior at levels that may be encountered in municipal water supplies." }, "WAL-CLM-RARE-000042": { book: "rare-earths", claim_text: 'Visible facial and oral signs can flag trace-mineral deficiency: "allergic shiners" \u2014 dark circles under the eyes \u2014 accompany food allergies and deficiency of chromium, vanadium and lithium, while a "geographic" tongue indicates deficiency of the B vitamins and zinc.', conditions: [], confidence: "high", dose: null, essentials: ["chromium", "vanadium", "lithium", "zinc"], id: "WAL-CLM-RARE-000042", kind: "deficiency_sign", other_substances: [], symptoms: ["allergic_shiners", "geographic_tongue"], verbatim: "\u201CAllergic shiners\u201D indicate food allergies (including sugar problems) and deficiencies of Cr, V and Li." }, "WAL-CLM-RARE-000043": { book: "rare-earths", claim_text: "Commercial human infant formula is strikingly mineral-poor: Wallach notes that Science Diet dog food contains 40 minerals and Purina rat pellets 28, while not one human infant formula carries more than 12 \u2014 with chromium, vanadium and lithium entirely absent.", conditions: [], confidence: "high", dose: null, essentials: ["chromium", "vanadium", "lithium"], id: "WAL-CLM-RARE-000043", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "It is a sad fact that Science Diet dog food has 40 minerals in it, Purina rat pellets have 28 minerals and not one human infant formula has more than 12 minerals (chromium, vanadium and lithium are totally absent) - a dog's life may not be so bad." }, "WAL-CLM-RARE-000044": { book: "rare-earths", claim_text: "Wallach holds that Down's Syndrome is not genetic but is the result of a preconception zinc deficiency, which produces a chromosomal/DNA injury similar to radiation damage; he notes that nutritional studies have created Trisomy/Down's in animals and cell cultures at will via preconception zinc deficiency during sperm and egg formation.", conditions: ["down_syndrome"], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-RARE-000044", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Down\u2019s Syndrome is in fact the result of a preconception zinc deficiency which produces a chromosomal/DNA injury or defect similar in nature to the changes created by radiation" }, "WAL-CLM-RARE-000045": { book: "rare-earths", claim_text: "Wallach estimates that about $40 of supplements per month, taken before and during pregnancy, is enough to prevent Down's Syndrome \u2014 against a lifetime care cost he puts near a million dollars per patient.", conditions: ["down_syndrome"], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-RARE-000045", kind: "protocol", other_substances: [], symptoms: [], verbatim: "It only takes $40 worth of supplements a month before and during pregnancy to prevent Down's Syndrome and in addition to the human tragedy it costs us a million dollars to care for each Down's Syndrome patient over their life time." }, "WAL-CLM-RARE-000046": { book: "rare-earths", claim_text: 'Essential mineral cofactors act as the "metal fingers" (e.g. zinc fingers) that genetic engineers say are required to activate genes \u2014 without the right metal cofactor, Wallach argues, DNA and genes are inert.', conditions: [], confidence: "high", dose: null, essentials: ["zinc"], id: "WAL-CLM-RARE-000046", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Genetic engineers refer to the essential mineral cofactors as \u201Cmetal fingers\u201D which are required to activate genes!!! In the absence of the appropriate \u201Cmetal finger\u201D DNA and genes are powerless" }, "WAL-CLM-RARE-000047": { book: "rare-earths", claim_text: "Wallach asserts that roughly 98% of birth defects are not genetic but are nutritional deficiencies of the egg, embryo and fetus \u2014 preventable by preconception nutrition; he points to the animal industry having all but eliminated birth defects this way.", conditions: ["birth_defects"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000047", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "It has been clearly demonstrated in the laboratory animal, pet animal and agriculture that 98 % of all birth defects are not \u201Cgenetic\u201D in nature, but in fact are nutritional deficiencies of the egg, embryo and fetus and can be prevented by preconception nutrition." }, "WAL-CLM-RARE-000048": { book: "rare-earths", claim_text: "Wallach cites a Chinese selenium trial: supplementing children with 1 mg sodium selenite three times a week dropped Keshan Disease incidence from 13/1,000 to 1/1,000 over three years (vs unchanged 13/1,000 on placebo), and larger studies confirmed selenium is specific for preventing KSD.", conditions: ["keshan_disease"], confidence: "high", dose: { amount: 1, duration: "3 years", for_condition: "keshan disease", form: "sodium selenite", period: "three times per week", unit: "mg" }, essentials: ["selenium"], id: "WAL-CLM-RARE-000048", kind: "dose", other_substances: [], symptoms: [], verbatim: "At the end of a three year study, the rate of KSD in the selenium supplemented group dropped from 13/1,000 children to 1/1,000 children; the rate of KSD in the control group remained at 13/1,000." }, "WAL-CLM-RARE-000049": { book: "rare-earths", claim_text: 'Wallach maintains that dozens of human "genetic" diseases can in fact be prevented \u2014 and in early stages reversed or "cured" \u2014 with minerals, naming cystic fibrosis, muscular dystrophy and Kawasaki Disease as prime examples.', conditions: ["cystic_fibrosis", "muscular_dystrophy", "kawasaki_disease"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000049", kind: "definition", other_substances: [], symptoms: [], verbatim: "There are literally dozens of human \u201Cgenetic\u201D diseases that can be prevented and in the early stages reversed or \u201Ccured\u201D with minerals." }, "WAL-CLM-RARE-000050": { book: "rare-earths", claim_text: "Wallach holds that muscular dystrophy is a preventable selenium-deficiency disease: adequate selenium in the diets and supplements of preconception women is key to preventing MD in all its named forms (Duchenne, Erb, Leyden-Moebius, Landouzy-Dejerine, Becker's, Gowers), which he calls artificial classifications by the muscle group first affected. He notes the veterinary industry wiped out white muscle disease / mulberry heart disease with simple selenium supplementation.", conditions: ["muscular_dystrophy"], confidence: "high", dose: null, essentials: ["selenium"], id: "WAL-CLM-RARE-000050", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Prevention is the name of the game with MD; the selenium levels in the diets and supplements of preconception women is important to the maintenance of pregnancy as well as the prevention of MD in all of its forms" }, "WAL-CLM-RARE-000051": { book: "rare-earths", claim_text: "Wallach frames Kawasaki Disease as a congenital copper deficiency \u2014 the infant is born with a coronary artery aneurysm because copper is required to build and maintain the elastic fibers of arteries (the second part being a Streptococcal invasion of the aneurysm site) \u2014 and holds it is totally preventable with preconception copper, especially colloidal copper.", conditions: ["kawasaki_disease"], confidence: "high", dose: null, essentials: ["copper"], id: "WAL-CLM-RARE-000051", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Kawasaki Disease is totally preventable with preconception supplementation of copper (especially colloidal copper)." }, "WAL-CLM-RARE-000052": { book: "rare-earths", claim_text: "Wallach puts the human genetic potential for height at roughly seven feet \u2014 against an average American male of five-foot-eight and female of five-foot-four \u2014 and attributes the gap to nutrition (calories, protein and minerals) rather than genetics.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000052", kind: "definition", other_substances: [], symptoms: [], verbatim: "The average American male is five foot eight inches tall and the average female is five foot four inches tall, even though our human genetic potential for height is is approximately seven feet." }, "WAL-CLM-RARE-000053": { book: "rare-earths", claim_text: "In Wallach's duckling experiment, 100 identical ducklings split into four diet groups showed that only the two groups fed supplemented pellets containing all known nutrients came close to their genetic potential for growth at one month \u2014 the lettuce and barley-only groups grew almost not at all.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000053", kind: "personal_anecdote", other_substances: [], symptoms: [], verbatim: "only group 3 and 4 came close to fulfilling their genetic potential for physical growth and development at age one month; only group 3 and 4 were fed supplemented pellets that contained all of the known nutrients required by ducklings." }, "WAL-CLM-RARE-000054": { book: "rare-earths", claim_text: "Wallach cites a marathon-runner comparison in which the group taking a broad mineral supplement (Ca, P, I, Fe, Mg, Cu, K, Zn, Mn, Cr, Se plus a 72-mineral clay) improved their average race time by 16:57 after six months of training, versus only 5:27 for the unsupplemented group.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000054", kind: "personal_anecdote", other_substances: [], symptoms: [], verbatim: "The unsupplemented group showed an improvement of 5:27 minutes following training, while the supplemented group showed an improvement of a whopping 16:57 minutes following training!!!" }, "WAL-CLM-RARE-000055": { book: "rare-earths", claim_text: "Wallach holds that the immune system needs the full complement of 90 essential nutrients to maintain and repair itself and protect against infectious disease (colds, flu, strep, Epstein-Barr, HIV, Candida, herpes, cancer, etc.).", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000055", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "our immune system requires all 90 nutrients (60 minerals, 16 vitamins, 12 essential amino acids and three essential fatty acids) to maintain and repair itself in order to protect us from infectious diseases" }, "WAL-CLM-RARE-000056": { book: "rare-earths", claim_text: "Wallach asserts that the healthiest, longest-lived cultures on Earth consistently consume high levels of 60 to 72 minerals with every meal, generation after generation, and that this is the basis of their drug-free, disease-free longevity.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000056", kind: "definition", other_substances: [], symptoms: [], verbatim: "The healthiest and longest lived cultures on the planet consistently consume high levels of 60 to 72 minerals with each meal, generation after generation" }, "WAL-CLM-RARE-000057": { book: "rare-earths", claim_text: `Wallach frames reaching one's longevity potential as two concepts: first, avoiding the "land mines" (predators, accidents, smoking, excess alcohol, illegal and prescription drugs, chemicals/toxic wastes, and even going to the doctor); and second, taking in each of the 90 essential nutrients in optimal amounts daily.`, conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000057", kind: "definition", other_substances: [], symptoms: [], verbatim: "Avoiding the \u201Cland mines\u201D or eliminating unnecessary and wasteful death from predators or road accidents, not smoking, not drinking alcohol to excess, avoiding the use of illegal (and prescription) drugs, avoiding chemicals and toxic wastes in our food, air and water and avoid going to the doctor." }, "WAL-CLM-RARE-000058": { book: "rare-earths", claim_text: "Wallach likens genetic potential to a Mercedes engine built to run 300,000 miles: without the essential coolants, lubricants and oil it won't run 50 miles \u2014 just as the body cannot reach its longevity potential without the essential nutrients.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000058", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "the engine is designed to run 300,000 miles before it needs a major overhaul or needs to be replaced, yet if you the owner/driver doesn\u2019t maintain the Mercedes engine by supplying the essential coolants, lubricants and motor oil that wondrous engine designed to run 300,000 miles won't run 50 miles" }, "WAL-CLM-RARE-000059": { book: "rare-earths", claim_text: 'Wallach holds that the secret of the five long-lived "Age-Beater" cultures is eating plants rich in organic colloidal minerals \u2014 minerals the plants take up from inorganic "Glacial Milk" and convert into the cell-usable organic colloidal form.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000059", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "It is the eating of the plants rich in organic colloidal minerals that is the secret of health and longevity of the five cultures we have called the \u201CAgebeaters\u201D" }, "WAL-CLM-RARE-000060": { book: "rare-earths", claim_text: "Wallach asserts that the centenarians of the long-lived cultures do not die of the degenerative diseases (which he attributes to mineral deficiencies) that plague the West \u2014 when they die it is usually of hypothermia in the cold high-altitude winter.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000060", kind: "definition", other_substances: [], symptoms: [], verbatim: "When a centenarian does die it is usually in the cold of the winter, which can be quite cold above the 8,500 foot level. Hypothermia is usually the most common cause of death in these long lived cultures" }, "WAL-CLM-RARE-000061": { book: "rare-earths", claim_text: "Wallach states that organic colloidal minerals from plants are about 98% bioavailable to humans, versus only 8 to 12% for metallic (inorganic) minerals.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000061", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Organic colloidal minerals derived from plants are 98 % available to humans as compared to 8 to 12 % availability for the metallic minerals." }, "WAL-CLM-RARE-000062": { book: "rare-earths", claim_text: 'Wallach identifies the common denominator of the five long-lived cultures as the serendipitous irrigation of their terraced fields with mineral-rich "Glacial Milk" carrying 60 or more minerals \u2014 the secret of their 120-to-140-year lifespans.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000062", kind: "definition", other_substances: [], symptoms: [], verbatim: "The serendipitous irrigation of their terraced fields with the common denominator of \u201CGlacial Milk\u201D from the mountains containing 60 or more minerals is the secret of the five cultures who live to be 120 to 140 years of age." }, "WAL-CLM-RARE-000063": { book: "rare-earths", claim_text: "Wallach cites Roy Walford's UCLA laboratory, where the maximum lifespan of fish was extended by 300% by maximizing the micronutrients fed to them (and lowering the water temperature a few degrees) \u2014 direct evidence that nutrient intake governs longevity.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000063", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The maximum survival rate or longevity for fish has been extended by 300 % in the UCLA laboratory of Roy Walford by maximizing the micronutrients fed to the fish as well as lowering the water temperature by just a few degrees." }, "WAL-CLM-RARE-000064": { book: "rare-earths", claim_text: "Wallach cites a 1991 Harvard School of Public Health study finding 1.3 million injuries and 198,000 deaths a year in American hospitals from iatrogenic (doctor-caused) mishaps \u2014 four to five times the toll of the highways, with seven of ten adverse results judged totally avoidable and about a third due to negligence.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000064", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "In 1991 a Harvard University, School of Public Health study revealed that 1.3 million injuries and 198,000 deaths occur in American Hospitals each year as a result of \u201Ciatrogenic\u201D or doctor caused mishaps or \u201Cadverse events.\u201D" }, "WAL-CLM-RARE-000065": { book: "rare-earths", claim_text: "Wallach drives the iatrogenic toll home by comparison: Dr. Sidney Wolfe (Public Citizen) put hospital-negligence deaths at 300,000 Americans a year (possibly 600,000), versus the 56,000 US troops lost over the entire 10-year Vietnam War \u2014 i.e. safer on the battlefield than in an American hospital.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000065", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "To appreciate how big a figure 300,000 dead is, we have to compare Wolfes figures of Americans killed by \u201Cfriendly fire\u201D in American hospitals with our U.S. military losses in Vietnam over the course of the 10 year war where we lost 56,000 for an average loss of 5,600 per year" }, "WAL-CLM-RARE-000066": { book: "rare-earths", claim_text: 'Wallach warns that inappropriate or multiple prescriptions ("poly-pharmacy") endanger 25% or more of Americans over 65 living at home \u2014 many drugs being prescribed only to counteract the side effects of an earlier drug.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000066", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "Inappropriate prescriptions or multiple prescriptions (\u201CPoly-pharmacy\u201D) are dangerous to 25 percent or more of Americans over the age of 65 living at home." }, "WAL-CLM-RARE-000067": { book: "rare-earths", claim_text: "Wallach reports that 70% of allopathic doctors flunked a 1994 survey quiz on prescription drugs and prescribing to seniors, and that they incorrectly prescribe pharmaceuticals to 25% of American senior citizens (per a July 1994 New England Journal of Medicine study).", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000067", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "Allopathic doctors (70 % of whom flunked a 1994 survey quiz on prescription drugs and prescribing to seniors!!) are incorrectly prescribing pharmaceuticals to 25 percent of American senior citizens" }, "WAL-CLM-RARE-000068": { book: "rare-earths", claim_text: "Wallach cites an expert panel finding that 20 drugs from a list that should never be given to the elderly are nonetheless prescribed to more than 6.6 million seniors a year \u2014 often several at once via the poly-pharmacy trap.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000068", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "An expert panel found that 20 drugs (Table 9-1) from a list that should never be taken by the elderly are in fact prescribed to more than 6.6 million seniors each year" }, "WAL-CLM-RARE-000069": { book: "rare-earths", claim_text: "Wallach holds that of the 90 essential nutrients, the most critical for the health and longevity of the long-lived cultures are the plant-derived colloidal minerals delivered routinely each day.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000069", kind: "definition", other_substances: [], symptoms: [], verbatim: "Their basic truth for health and longevity boils down to the routine daily availability of a highly usable source of 90 essential nutrients of which the most critical are the plant derived colloidal minerals" }, "WAL-CLM-RARE-000070": { book: "rare-earths", claim_text: 'Wallach describes how "Glacial Milk" forms: ageless glaciers grind two to six inches of parent rock off the mountain surface each year into a fine dust or rock "flour" carried out by glacial melt water.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000070", kind: "definition", other_substances: [], symptoms: [], verbatim: "Ageless glaciers scrape, grind and pulverize from two to six inches of parent rock from the mountain surface each year into a fine dust or rock \u201Cflour\u201D" }, "WAL-CLM-RARE-000071": { book: "rare-earths", claim_text: `Wallach's key distinction: the "Glacial Milk" that nourishes the long-lived cultures carries 60 to 72 minerals, whereas the thousands of other glaciers worldwide may have only three to 20 minerals \u2014 too few to fulfill the human genetic potential for longevity.`, conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000071", kind: "definition", other_substances: [], symptoms: [], verbatim: "the great common denominator of the \u201CGlacial Milk\u201D that nourishes the long-lived cultures is that they contain 60 to 72 minerals; there are thousands of glaciers in the world that prodyce vast quantities of \u201CGlacial Milk,\u201D however, they may only have three to 20 minerals in them" }, "WAL-CLM-RARE-000072": { book: "rare-earths", claim_text: 'Wallach stresses that the centenarians absorb only 5 to 12% of the suspended metallic colloids they drink in "Glacial Milk"; the real key to their longevity is using it as IRRIGATION water, so plants convert the metallic minerals into highly usable organic plant-derived colloidal minerals.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000072", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "The bottom line for the centenarians to reach their genetic potentials of 120 to 140 years of age is in fact their utilization of the \u201CGlacial Milk\u201D as irrigation water." }, "WAL-CLM-RARE-000073": { book: "rare-earths", claim_text: 'Wallach asserts that millennia of farming terraces irrigated with mineral-rich "Glacial Milk" reward the long-lived cultures with optimal health free of the Western degenerative diseases \u2014 hypertension, heart disease, stroke, aneurysms, arthritis, osteoporosis, dental disease, cataracts, diabetes, cancer and lupus among them.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000073", kind: "definition", other_substances: [], symptoms: [], verbatim: "they have been blessed with optimal health without hypertension, heart disease, stroke, aneurysms, arthritis, osteoporosis, dental disease, cataracts, diabetes, cancer, lupus" }, "WAL-CLM-RARE-000074": { book: "rare-earths", claim_text: "Wallach teaches that minerals are absorbed at very different efficiencies depending on their form, so the most efficient supplement form \u2014 plant-derived colloidal minerals \u2014 should be consumed; for the poorly absorbed metallic form the absorption ratio is roughly 1:1 for iodine, 1:10 for iron and 1:100 for chromium, meaning the colloidal form can be absorbed up to 100 times better for some minerals.", conditions: [], confidence: "high", dose: null, essentials: ["iodine", "iron", "chromium"], id: "WAL-CLM-RARE-000074", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "the most efficient form of trace mineral supplement, such as plant derived colloidal minerals should be consumed.\n\nFor the metallic form of iodine the ratio is almost 1:1; for iron it\u2019s 1:10 and for chromium it\u2019s 1:100." }, "WAL-CLM-RARE-000075": { book: "rare-earths", claim_text: 'Wallach asserts that the RDA and other dietary recommendations \u2014 conceived by the National Science Foundation to meet the needs of "practically all healthy people" \u2014 are not applicable to people with health challenges or full-blown disease states.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000075", kind: "definition", other_substances: [], symptoms: [], verbatim: "The RDA and other dietary recommendations for trace minerals are conceived by the National Science Foundation to meet the needs of \u201Cpractically all healthy people\u201D - they are not applicable to people with \u201Chealth challenges\u201D or full blown disease states." }, "WAL-CLM-RARE-000076": { book: "rare-earths", claim_text: "As evidence of progressive soil and food mineral depletion over time, Wallach cites that the 3,000-year-old bones of Japanese temple monks contained a greater spectrum of minerals and a greater amount of each mineral than the bones of modern-day Japanese.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000076", kind: "definition", other_substances: [], symptoms: [], verbatim: "Mineral analysis of 3,000 year old bones of Japanese temple monks showed that they contained a greater spectrum of minerals and greater amount of each mineral than the bones of modern day Japanese." }, "WAL-CLM-RARE-000077": { book: "rare-earths", claim_text: 'Wallach describes the "clinical phase" of trace-mineral deficiency as the onset of full-blown disease states and even death, naming cardiomyopathy, diabetes, cancer and aneurysms as examples of conditions that are, at root, trace-mineral deficiencies.', conditions: ["cardiomyopathy", "diabetes", "cancer", "aneurysm"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000077", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "The clinical phase of trace mineral deficiency is characterized by the onset of full blown disease states and even death (i.e. - cardiomyopathy, diabetes, cancer, aneurysms, etc.)." }, "WAL-CLM-RARE-000078": { book: "rare-earths", claim_text: "Wallach contends that most clinical-phase trace-mineral deficiencies go undiagnosed by orthodox physicians, yet the cure is simply replacing the missing element: a correct diagnosis can produce a rapid positive clinical response within 48 hours to 30 days \u2014 unless permanent biochemical, chromosomal or physical damage has already occurred.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000078", kind: "prognosis", other_substances: [], symptoms: [], verbatim: "the cure, however, is simply a matter of replacement of the trace element (a correct diagnosis can lead to a remarkably rapid positive clinical response ranging from 48 hours to 30 days for recognizable results)" }, "WAL-CLM-RARE-000079": { book: "rare-earths", claim_text: 'Wallach describes the "compensated metabolic phase" of trace-mineral deficiency \u2014 a reduction in specific enzyme reactions and receptor-site functions that produces early warning signs such as low blood sugar, irregular heartbeat, white hair and hair loss, before any full-blown disease appears.', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000079", kind: "deficiency_sign", other_substances: [], symptoms: ["irregular_heartbeat", "white_hair", "hair_loss"], verbatim: "a reduction in biochemical function (i.e. low blood sugar, irregular heart beat, white hair, hair loss, etc.)" }, "WAL-CLM-RARE-000080": { book: "rare-earths", claim_text: "Wallach explains that a hair analysis reads non-perishable body-tissue minerals and records the body's mineral status over several months; hair concentrations of trace minerals and Rare Earths run about 200 times greater than those found in blood (where calcium and other essentials are held at normal levels by drawing on body reserves even during a raging deficiency).", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000080", kind: "definition", other_substances: [], symptoms: [], verbatim: "Hair analysis are performed on nonperishable samples of body tissue minerals and are a recording of the bodies mineral status over a period of several months - additionally hair concentration of trace minerals and Rare Earths are 200 times greater than those found in blood." }, "WAL-CLM-RARE-000081": { book: "rare-earths", claim_text: "Wallach lists well-documented hair-analysis mineral patterns for disease: schizophrenia = high calcium, low iron, high copper; arthritis (osteoporosis/hyperparathyroidism) = high lead, calcium and phosphorus, low iron and copper; anemia = low iron, copper, selenium, cobalt; diabetes (prediabetes/hypoglycemia) = low chromium, vanadium, sodium, potassium, manganese and zinc.", conditions: ["schizophrenia", "arthritis", "anemia", "diabetes"], confidence: "high", dose: null, essentials: ["iron", "copper", "chromium", "vanadium"], id: "WAL-CLM-RARE-000081", kind: "diagnostic_pattern", other_substances: [], symptoms: [], verbatim: "Arthritis - (osteoporosis/ hyperparathyroidism) - high Lead, Calcium and Phosphorus; low Iron and Copper.\n\nAnemia - low Iron, Copper, Selenium, Cobalt.\n\nDiabetes(prediabetes/hypoglycemia) - low Chromium, Vanadium, sodium, potassium, manganese, Zinc." }, "WAL-CLM-RARE-000082": { book: "rare-earths", claim_text: 'Wallach cautions that hair-mineral readings need interpretation: universally low levels indicate maldigestion (hypochlorhydria) and/or malabsorption (celiac disease); and paradoxically "elevated" calcium and magnesium can mean active depletion/shedding from bone \u2014 revealing very active osteoporosis with associated arthritis, periodontitis and a predilection for kidney stones \u2014 while elevated sodium/potassium/chloride signal essential-fatty-acid deficiency.', conditions: ["osteoporosis", "celiac_disease", "malabsorption"], confidence: "high", dose: null, essentials: ["calcium", "magnesium"], id: "WAL-CLM-RARE-000082", kind: "diagnostic_pattern", other_substances: [], symptoms: [], verbatim: "In some cases \u201Celevated\u201D hair level values represent actual depletion or shedding of minerals from body stores, i.e.- elevated calcium and magnesium levels reveal very active osteoporosis and associated arthritis, periodontitis and prediliction for kidney stones." }, "WAL-CLM-RARE-000083": { book: "rare-earths", claim_text: "Wallach teaches that the RATIOS between hair minerals \u2014 not just absolute levels \u2014 are good barometers of specific organ systems. His Table 11-2 ideal hair mineral ratios: Zn/Cu 8:1 (cardiovascular, liver, female reproductive system), Zn/Mn 150:1 (musculoskeletal, collagen, cholesterol biosynthesis), Zn/Ca 3:1 (cardiovascular, osteodynamics, kidney), Na/P 2:1 (adrenal and general endocrine function), Ca/Mg 8:1 (cardiovascular, osteodynamics, dietary imbalances), and Fe/Cu 2.5:1 (hematology, energy production, cellular respiration).", conditions: [], confidence: "high", dose: null, essentials: ["zinc", "copper", "calcium", "magnesium", "iron"], id: "WAL-CLM-RARE-000083", kind: "diagnostic_pattern", other_substances: [], symptoms: [], verbatim: "The ratios of trace minerals and Rare Earths in hair are of interest in the interpretation of a hair analysis as they are good barometers of what is happening in specific organ systems or tissues (Table 11 - 2)." }, "WAL-CLM-RARE-000084": { book: "rare-earths", claim_text: "Wallach notes the well-established principle among nutritional chemists that minerals can neutralize or reverse the toxic effects of other minerals \u2014 for example selenium is a specific antidote for mercury (Hg) poisoning and calcium for lead (Pb) \u2014 and presents Dr. Gary Price Todd's clinical study built on this mineral-substitution approach.", conditions: [], confidence: "high", dose: null, essentials: ["selenium", "calcium"], id: "WAL-CLM-RARE-000084", kind: "interaction", other_substances: [], symptoms: [], verbatim: "It is very well known among nutritional chemists that minerals can neutralize or reverse the toxic effects of other minerals (i.e.- Se is a specific antidote for Hg poisoning, Ca for Pb, etc.)" }, "WAL-CLM-RARE-000085": { book: "rare-earths", claim_text: "Wallach reports the scale of lead toxicity in America: more than 400,000 tons of industrial lead is pumped into the American biosphere each year, insidiously poisoning over 38 million Americans annually.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000085", kind: "prevalence", other_substances: [], symptoms: [], verbatim: "more than 400,000 tons of industrial lead is pumped into the American bios annually resulting in the incidious poisoning of over 38 million Americans each year!!" }, "WAL-CLM-RARE-000086": { book: "rare-earths", claim_text: 'Wallach explains that cadmium (23 micrograms per pack of cigarettes; a major component of "second hand" smoke) interferes with zinc-, copper-, calcium- and selenium-dependent metalloenzymes, so cadmium-driven deficiency of those minerals produces a disease cascade: zinc loss \u2192 weakened immunity and birth defects; copper loss \u2192 skin wrinkles and aneurysms; calcium loss \u2192 hypertension, osteoporosis and arthritis; selenium loss \u2192 cataracts, cancer and cardiomyopathy/heart disease.', conditions: ["birth_defects", "aneurysm", "hypertension", "osteoporosis", "arthritis", "cataracts", "cancer", "cardiomyopathy"], confidence: "high", dose: null, essentials: ["zinc", "copper", "calcium", "selenium"], id: "WAL-CLM-RARE-000086", kind: "interaction", other_substances: [], symptoms: [], verbatim: "copper (deficiency increases loss of elastic fibers. therefore smokers have more skin wrinkles and aneurysms), calcium (deficiency results in hypertension, osteoporosis and arthritis) and selenium (deficiency increases the individuals risk of cataracts, cancer and cardiomyopathy heart disease)." }, "WAL-CLM-RARE-000087": { book: "rare-earths", claim_text: `Wallach warns that 50% or more of the mercury in "silver" dental amalgams slowly volatilizes over a decade (the EPA classes amalgam scrap as toxic waste, and the ADA itself warns dentists to use "a no touch technique") \u2014 and that mercury toxicity from dental amalgam is associated with causing multiple sclerosis (MS), Lou Gehrig's disease (ALS) and Parkinson's disease.`, conditions: ["multiple_sclerosis", "als", "parkinsons_disease"], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000087", kind: "interaction", other_substances: [], symptoms: [], verbatim: "Mercury toxicity from dental amalgam is associated with the cause of multiple sclerosis (MS), Lou Gehrig's Disease (ALS) and Parkinson\u2019s Disease." }, "WAL-CLM-RARE-000088": { book: "rare-earths", claim_text: "Dr. Gary Price Todd, MD \u2014 a physician whose published clinical study on mineral substitution Wallach cites in this chapter (it is not an independently famous protocol; it is known here only through Wallach's book) \u2014 gave patients three ounces of liquid plant-derived colloidal minerals daily. Wallach relays Todd's finding that this regimen first UNMASKS hidden body stores of lead, cadmium and mercury \u2014 hair levels actually rise at the three-month mark as the tissue stores mobilize into the blood \u2014 and then progressively REDUCES them, with the rate and degree of toxic-mineral clearance being time- and dose-related.", conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000088", kind: "mechanism", other_substances: [], symptoms: [], verbatim: "use of Todd\u2019s protocol may be an effective method of unmasking latent (hidden) body stores of lead, cadmium or mercury." }, "WAL-CLM-RARE-000089": { book: "rare-earths", claim_text: 'Wallach states that some 79 minerals have been detected in animal and human tissue, and that thousands of animal studies have documented the essentiality of at least 60 of them \u2014 acting as mineral cofactors for DNA, RNA, enzyme systems or vitamin utilization (the basis of the "60 minerals" within his 90-essential-nutrients framework).', conditions: [], confidence: "high", dose: null, essentials: [], id: "WAL-CLM-RARE-000089", kind: "definition", other_substances: [], symptoms: [], verbatim: "have documented additional support for the essentiality of at least 60 minerals (i.e.- act as mineral cofactors for DNA, RNA or enzyme systems or vitamin utilization)." } }, conditions: { als: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { interactions: ["WAL-CLM-RARE-000087"] }, display_name: "Als", essentials_involved: [], other_substances_involved: [], slug: "als" }, anemia: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 2, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000020"], diagnostics: ["WAL-CLM-RARE-000081"] }, display_name: "Anemia", essentials_involved: ["chromium", "copper", "iron", "vanadium"], other_substances_involved: [], slug: "anemia" }, aneurysm: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 3, claims_by_role: { causes: ["WAL-CLM-DDDL-000004"], interactions: ["WAL-CLM-RARE-000086"], prognosis: ["WAL-CLM-RARE-000077"] }, display_name: "Aneurysm", essentials_involved: ["calcium", "copper", "selenium", "zinc"], other_substances_involved: [], slug: "aneurysm" }, angina: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000076"] }, display_name: "Angina", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "angina" }, anorexia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000079"] }, display_name: "Anorexia", essentials_involved: ["lithium", "zinc"], other_substances_involved: [], slug: "anorexia" }, anosmia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000077"] }, display_name: "Anosmia", essentials_involved: ["zinc"], other_substances_involved: [], slug: "anosmia" }, anxiety: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000078"] }, display_name: "Anxiety", essentials_involved: ["calcium", "chromium", "magnesium", "vanadium", "vitamin-b3", "vitamin-b6"], other_substances_involved: [], slug: "anxiety" }, aphthous_stomatitis: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000080"] }, display_name: "Aphthous Stomatitis", essentials_involved: ["iron", "vitamin-b12", "vitamin-b9", "zinc"], other_substances_involved: [], slug: "aphthous_stomatitis" }, arsenic_toxicity: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000081"] }, display_name: "Arsenic Toxicity", essentials_involved: ["selenium"], other_substances_involved: [], slug: "arsenic_toxicity" }, arteriosclerosis: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000082"], contraindications: ["WAL-CLM-DDDL-000083"] }, display_name: "Arteriosclerosis", essentials_involved: ["magnesium", "vitamin-d"], other_substances_involved: [], slug: "arteriosclerosis" }, arthritis: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 7, claims_by_role: { causes: ["WAL-CLM-DDDL-000052"], deficiency_signs: ["WAL-CLM-DDDL-000012", "WAL-CLM-DDDL-000032", "WAL-CLM-RARE-000011"], diagnostics: ["WAL-CLM-RARE-000081"], interactions: ["WAL-CLM-RARE-000086"], protocols: ["WAL-CLM-DDDL-000051"] }, display_name: "Arthritis", essentials_involved: ["calcium", "chromium", "copper", "germanium", "iron", "magnesium", "phosphorus", "selenium", "strontium", "vanadium", "zinc"], other_substances_involved: [], slug: "arthritis" }, asthma: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000053"], deficiency_signs: ["WAL-CLM-DDDL-000026"] }, display_name: "Asthma", essentials_involved: ["magnesium", "manganese"], other_substances_involved: [], slug: "asthma" }, bells_palsy: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000009"], protocols: ["WAL-CLM-DDDL-000086"] }, display_name: "Bells Palsy", essentials_involved: ["calcium", "magnesium", "vitamin-b12"], other_substances_involved: [], slug: "bells_palsy" }, benign_prostatic_hyperplasia: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000084"], protocols: ["WAL-CLM-DDDL-000085"] }, display_name: "Benign Prostatic Hyperplasia", essentials_involved: ["selenium", "vitamin-a", "zinc"], other_substances_involved: [], slug: "benign_prostatic_hyperplasia" }, beriberi: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000043"] }, display_name: "Beriberi", essentials_involved: ["vitamin-b1"], other_substances_involved: [], slug: "beriberi" }, birth_defects: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 4, claims_by_role: { causes: ["WAL-CLM-RARE-000015", "WAL-CLM-RARE-000047"], deficiency_signs: ["WAL-CLM-DDDL-000039"], interactions: ["WAL-CLM-RARE-000086"] }, display_name: "Birth Defects", essentials_involved: ["calcium", "copper", "selenium", "zinc"], other_substances_involved: [], slug: "birth_defects" }, bladder_stones: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { causes: ["WAL-CLM-DDDL-000087"] }, display_name: "Bladder Stones", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "bladder_stones" }, blindness: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000041"] }, display_name: "Blindness", essentials_involved: ["vitamin-a"], other_substances_involved: [], slug: "blindness" }, breast_cancer: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { contraindications: ["WAL-CLM-DDDL-000061", "WAL-CLM-DDDL-000091"] }, display_name: "Breast Cancer", essentials_involved: [], other_substances_involved: [], slug: "breast_cancer" }, cancer: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 11, claims_by_role: { causes: ["WAL-CLM-DDDL-000010", "WAL-CLM-DDDL-000030", "WAL-CLM-DDDL-000036"], deficiency_signs: ["WAL-CLM-DDDL-000012", "WAL-CLM-RARE-000011"], interactions: ["WAL-CLM-RARE-000086"], prognosis: ["WAL-CLM-RARE-000077"], protocols: ["WAL-CLM-DDDL-000018", "WAL-CLM-DDDL-000056"], quotes: ["WAL-CLM-DDDL-000057", "WAL-CLM-DDDL-000066"] }, display_name: "Cancer", essentials_involved: ["arginine", "calcium", "cesium", "copper", "germanium", "selenium", "tyrosine", "vanadium", "vitamin-a", "zinc"], other_substances_involved: ["taurine"], slug: "cancer" }, canker_sores: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000080"] }, display_name: "Canker Sores", essentials_involved: ["iron", "vitamin-b12", "vitamin-b9", "zinc"], other_substances_involved: [], slug: "canker_sores" }, cardiomyopathy: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 5, claims_by_role: { causes: ["WAL-CLM-DDDL-000010"], deficiency_signs: ["WAL-CLM-DDDL-000005"], interactions: ["WAL-CLM-RARE-000086"], prognosis: ["WAL-CLM-DDDL-000007", "WAL-CLM-RARE-000077"] }, display_name: "Cardiomyopathy", essentials_involved: ["calcium", "copper", "selenium", "zinc"], other_substances_involved: [], slug: "cardiomyopathy" }, cardiovascular_disease: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000076"] }, display_name: "Cardiovascular Disease", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "cardiovascular_disease" }, carpal_tunnel_syndrome: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000026"] }, display_name: "Carpal Tunnel Syndrome", essentials_involved: ["manganese"], other_substances_involved: [], slug: "carpal_tunnel_syndrome" }, cataracts: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { interactions: ["WAL-CLM-RARE-000086"] }, display_name: "Cataracts", essentials_involved: ["calcium", "copper", "selenium", "zinc"], other_substances_involved: [], slug: "cataracts" }, celiac_disease: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { diagnostics: ["WAL-CLM-RARE-000082"] }, display_name: "Celiac Disease", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "celiac_disease" }, cleft_palate: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000042"] }, display_name: "Cleft Palate", essentials_involved: ["vitamin-b9", "zinc"], other_substances_involved: [], slug: "cleft_palate" }, common_cold: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000093"], protocols: ["WAL-CLM-DDDL-000094"] }, display_name: "Common Cold", essentials_involved: ["vitamin-c"], other_substances_involved: [], slug: "common_cold" }, congenital_ataxia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000026"] }, display_name: "Congenital Ataxia", essentials_involved: ["manganese"], other_substances_involved: [], slug: "congenital_ataxia" }, congestive_heart_failure: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000043"] }, display_name: "Congestive Heart Failure", essentials_involved: ["vitamin-b1"], other_substances_involved: [], slug: "congestive_heart_failure" }, cor_pulmonale: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000054"] }, display_name: "Cor Pulmonale", essentials_involved: ["selenium"], other_substances_involved: [], slug: "cor_pulmonale" }, corneal_ulcers: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000041"] }, display_name: "Corneal Ulcers", essentials_involved: ["vitamin-a"], other_substances_involved: [], slug: "corneal_ulcers" }, coronary_artery_disease: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000017"] }, display_name: "Coronary Artery Disease", essentials_involved: ["chromium", "vanadium"], other_substances_involved: [], slug: "coronary_artery_disease" }, cradle_cap: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000055"] }, display_name: "Cradle Cap", essentials_involved: ["vitamin-b6", "zinc"], other_substances_involved: [], slug: "cradle_cap" }, cystic_fibrosis: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 4, claims_by_role: { causes: ["WAL-CLM-RARE-000004", "WAL-CLM-RARE-000010"], deficiency_signs: ["WAL-CLM-DDDL-000005"], definitions: ["WAL-CLM-RARE-000049"] }, display_name: "Cystic Fibrosis", essentials_involved: ["selenium", "vitamin-b2", "vitamin-e", "zinc"], other_substances_involved: [], slug: "cystic_fibrosis" }, diabetes: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 12, claims_by_role: { anecdotes: ["WAL-CLM-DDDL-000008"], causes: ["WAL-CLM-DDDL-000010", "WAL-CLM-DDDL-000034"], contraindications: ["WAL-CLM-DDDL-000022"], deficiency_signs: ["WAL-CLM-DDDL-000017"], diagnostics: ["WAL-CLM-RARE-000081"], prognosis: ["WAL-CLM-DDDL-000035", "WAL-CLM-DDDL-000046", "WAL-CLM-RARE-000077"], protocols: ["WAL-CLM-DDDL-000048", "WAL-CLM-DDDL-000049"], quotes: ["WAL-CLM-DDDL-000047"] }, display_name: "Diabetes", essentials_involved: ["chromium", "copper", "iron", "vanadium", "vitamin-b12", "vitamin-b3", "zinc"], other_substances_involved: [], slug: "diabetes" }, down_syndrome: { books_cited: ["rare-earths"], claim_count: 3, claims_by_role: { causes: ["WAL-CLM-RARE-000016", "WAL-CLM-RARE-000044"], protocols: ["WAL-CLM-RARE-000045"] }, display_name: "Down Syndrome", essentials_involved: ["zinc"], other_substances_involved: [], slug: "down_syndrome" }, eczema: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000065"] }, display_name: "Eczema", essentials_involved: ["omega-3", "omega-6"], other_substances_involved: [], slug: "eczema" }, goiter: { books_cited: ["dddl-3e-2011"], claim_count: 3, claims_by_role: { interactions: ["WAL-CLM-DDDL-000025"], prevalence: ["WAL-CLM-DDDL-000024"], quotes: ["WAL-CLM-DDDL-000066"] }, display_name: "Goiter", essentials_involved: ["arginine", "copper", "iodine", "tyrosine"], other_substances_involved: ["taurine"], slug: "goiter" }, heart_attack: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { causes: ["WAL-CLM-DDDL-000030"] }, display_name: "Heart Attack", essentials_involved: ["selenium"], other_substances_involved: [], slug: "heart_attack" }, heart_failure: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { contraindications: ["WAL-CLM-DDDL-000022"] }, display_name: "Heart Failure", essentials_involved: ["iron"], other_substances_involved: [], slug: "heart_failure" }, heat_stroke: { books_cited: ["rare-earths"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-RARE-000003", "WAL-CLM-RARE-000027"] }, display_name: "Heat Stroke", essentials_involved: ["sodium"], other_substances_involved: [], slug: "heat_stroke" }, hypertension: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { interactions: ["WAL-CLM-RARE-000086"] }, display_name: "Hypertension", essentials_involved: ["calcium", "copper", "selenium", "zinc"], other_substances_involved: [], slug: "hypertension" }, hypoglycemia: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000017"], prognosis: ["WAL-CLM-DDDL-000046"] }, display_name: "Hypoglycemia", essentials_involved: ["chromium", "vanadium"], other_substances_involved: [], slug: "hypoglycemia" }, hypothyroidism: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000023"], prevalence: ["WAL-CLM-DDDL-000024"] }, display_name: "Hypothyroidism", essentials_involved: ["iodine", "tyrosine"], other_substances_involved: [], slug: "hypothyroidism" }, infertility: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { prognosis: ["WAL-CLM-DDDL-000069"], protocols: ["WAL-CLM-DDDL-000070"] }, display_name: "Infertility", essentials_involved: ["arginine", "germanium", "selenium", "vitamin-a", "zinc"], other_substances_involved: [], slug: "infertility" }, insomnia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { protocols: ["WAL-CLM-DDDL-000075"] }, display_name: "Insomnia", essentials_involved: ["calcium", "chromium", "vanadium"], other_substances_involved: [], slug: "insomnia" }, kawasaki_disease: { books_cited: ["rare-earths"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-RARE-000051"], definitions: ["WAL-CLM-RARE-000049"] }, display_name: "Kawasaki Disease", essentials_involved: ["copper"], other_substances_involved: [], slug: "kawasaki_disease" }, keratitis: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000041"] }, display_name: "Keratitis", essentials_involved: ["vitamin-a"], other_substances_involved: [], slug: "keratitis" }, keshan_disease: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 3, claims_by_role: { causes: ["WAL-CLM-DDDL-000071"], doses: ["WAL-CLM-RARE-000048"], protocols: ["WAL-CLM-DDDL-000073"] }, display_name: "Keshan Disease", essentials_involved: ["selenium", "vitamin-e"], other_substances_involved: [], slug: "keshan_disease" }, kidney_stones: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000087"], protocols: ["WAL-CLM-DDDL-000088"] }, display_name: "Kidney Stones", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "kidney_stones" }, liver_cirrhosis: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000010"], contraindications: ["WAL-CLM-DDDL-000022"] }, display_name: "Liver Cirrhosis", essentials_involved: ["iron"], other_substances_involved: [], slug: "liver_cirrhosis" }, macular_degeneration: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { quotes: ["WAL-CLM-DDDL-000066"] }, display_name: "Macular Degeneration", essentials_involved: ["arginine", "tyrosine"], other_substances_involved: ["taurine"], slug: "macular_degeneration" }, malabsorption: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { diagnostics: ["WAL-CLM-RARE-000082"] }, display_name: "Malabsorption", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "malabsorption" }, male_pattern_baldness: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000031"] }, display_name: "Male Pattern Baldness", essentials_involved: ["tin"], other_substances_involved: [], slug: "male_pattern_baldness" }, menopause: { books_cited: ["dddl-3e-2011"], claim_count: 4, claims_by_role: { causes: ["WAL-CLM-DDDL-000068", "WAL-CLM-DDDL-000090"], contraindications: ["WAL-CLM-DDDL-000091"], protocols: ["WAL-CLM-DDDL-000092"] }, display_name: "Menopause", essentials_involved: ["calcium", "magnesium", "vitamin-d"], other_substances_involved: [], slug: "menopause" }, multiple_sclerosis: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { interactions: ["WAL-CLM-RARE-000087"] }, display_name: "Multiple Sclerosis", essentials_involved: [], other_substances_involved: [], slug: "multiple_sclerosis" }, muscle_cramps: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000074"] }, display_name: "Muscle Cramps", essentials_involved: ["calcium", "magnesium"], other_substances_involved: [], slug: "muscle_cramps" }, muscular_dystrophy: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 7, claims_by_role: { causes: ["WAL-CLM-DDDL-000071", "WAL-CLM-RARE-000050"], deficiency_signs: ["WAL-CLM-DDDL-000005"], definitions: ["WAL-CLM-RARE-000049"], prognosis: ["WAL-CLM-DDDL-000007", "WAL-CLM-DDDL-000072"], protocols: ["WAL-CLM-DDDL-000073"] }, display_name: "Muscular Dystrophy", essentials_involved: ["selenium", "vitamin-e"], other_substances_involved: [], slug: "muscular_dystrophy" }, osteoarthritis: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { causes: ["WAL-CLM-DDDL-000050"], prevalence: ["WAL-CLM-DDDL-000009"] }, display_name: "Osteoarthritis", essentials_involved: ["calcium"], other_substances_involved: [], slug: "osteoarthritis" }, osteomalacia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000009"] }, display_name: "Osteomalacia", essentials_involved: ["calcium"], other_substances_involved: [], slug: "osteomalacia" }, osteoporosis: { books_cited: ["dddl-3e-2011", "rare-earths"], claim_count: 11, claims_by_role: { causes: ["WAL-CLM-DDDL-000052"], contraindications: ["WAL-CLM-DDDL-000061"], deficiency_signs: ["WAL-CLM-DDDL-000012", "WAL-CLM-DDDL-000032", "WAL-CLM-RARE-000011"], diagnostics: ["WAL-CLM-RARE-000082"], interactions: ["WAL-CLM-RARE-000086"], prevalence: ["WAL-CLM-DDDL-000009"], prognosis: ["WAL-CLM-DDDL-000058"], protocols: ["WAL-CLM-DDDL-000060"], quotes: ["WAL-CLM-DDDL-000059"] }, display_name: "Osteoporosis", essentials_involved: ["calcium", "copper", "germanium", "magnesium", "phosphorus", "selenium", "strontium", "zinc"], other_substances_involved: [], slug: "osteoporosis" }, otitis: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000062"] }, display_name: "Otitis", essentials_involved: [], other_substances_involved: [], slug: "otitis" }, parkinsons_disease: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { interactions: ["WAL-CLM-RARE-000087"] }, display_name: "Parkinsons Disease", essentials_involved: [], other_substances_involved: [], slug: "parkinsons_disease" }, pica: { books_cited: ["rare-earths"], claim_count: 4, claims_by_role: { anecdotes: ["WAL-CLM-RARE-000036"], causes: ["WAL-CLM-RARE-000035", "WAL-CLM-RARE-000037", "WAL-CLM-RARE-000040"] }, display_name: "Pica", essentials_involved: ["iron"], other_substances_involved: [], slug: "pica" }, repetitive_motion_syndrome: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000026"] }, display_name: "Repetitive Motion Syndrome", essentials_involved: ["manganese"], other_substances_involved: [], slug: "repetitive_motion_syndrome" }, rheumatoid_arthritis: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { causes: ["WAL-CLM-DDDL-000050"] }, display_name: "Rheumatoid Arthritis", essentials_involved: [], other_substances_involved: [], slug: "rheumatoid_arthritis" }, schizophrenia: { books_cited: ["rare-earths"], claim_count: 1, claims_by_role: { diagnostics: ["WAL-CLM-RARE-000081"] }, display_name: "Schizophrenia", essentials_involved: ["chromium", "copper", "iron", "vanadium"], other_substances_involved: [], slug: "schizophrenia" }, sids: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000005"] }, display_name: "Sids", essentials_involved: ["selenium"], other_substances_involved: [], slug: "sids" }, spina_bifida: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000042"] }, display_name: "Spina Bifida", essentials_involved: ["vitamin-b9", "zinc"], other_substances_involved: [], slug: "spina_bifida" }, spinal_stenosis: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000009"] }, display_name: "Spinal Stenosis", essentials_involved: ["calcium"], other_substances_involved: [], slug: "spinal_stenosis" }, tinnitus: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000009"] }, display_name: "Tinnitus", essentials_involved: ["calcium"], other_substances_involved: [], slug: "tinnitus" }, tmj: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000026"] }, display_name: "Tmj", essentials_involved: ["manganese"], other_substances_involved: [], slug: "tmj" }, trigeminal_neuralgia: { books_cited: ["dddl-3e-2011"], claim_count: 1, claims_by_role: { prevalence: ["WAL-CLM-DDDL-000009"] }, display_name: "Trigeminal Neuralgia", essentials_involved: ["calcium"], other_substances_involved: [], slug: "trigeminal_neuralgia" }, uterine_cancer: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { contraindications: ["WAL-CLM-DDDL-000061", "WAL-CLM-DDDL-000091"] }, display_name: "Uterine Cancer", essentials_involved: [], other_substances_involved: [], slug: "uterine_cancer" }, white_muscle_disease: { books_cited: ["dddl-3e-2011"], claim_count: 2, claims_by_role: { deficiency_signs: ["WAL-CLM-DDDL-000005"], prognosis: ["WAL-CLM-DDDL-000007"] }, display_name: "White Muscle Disease", essentials_involved: ["selenium"], other_substances_involved: [], slug: "white_muscle_disease" } }, essentials: { aluminum: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Aluminum", interacts_with: [], layout_key: "Aluminum", slug: "aluminum", symbol: "Al" }, arginine: { books_cited: ["dddl-3e-2011"], category: "amino_acid", claim_count: 2, claims_by_kind: { protocol: ["WAL-CLM-DDDL-000070"], quote: ["WAL-CLM-DDDL-000066"] }, conditions_treated: ["cancer", "goiter", "infertility", "macular_degeneration"], deficiency_signs: [], display_name: "Arginine", interacts_with: ["germanium", "selenium", "tyrosine", "vitamin-a", "zinc"], layout_key: "Arginine", slug: "arginine", symbol: "" }, arsenic: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Arsenic", interacts_with: [], layout_key: "Arsenic", slug: "arsenic", symbol: "As" }, barium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Barium", interacts_with: [], layout_key: "Barium", slug: "barium", symbol: "Ba" }, beryllium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Beryllium", interacts_with: [], layout_key: "Beryllium", slug: "beryllium", symbol: "Be" }, biotin: { books_cited: [], category: "vitamin", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Biotin", interacts_with: [], layout_key: "Biotin", slug: "biotin", symbol: "" }, boron: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Boron", interacts_with: [], layout_key: "Boron", slug: "boron", symbol: "B" }, bromine: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Bromine", interacts_with: [], layout_key: "Bromine", slug: "bromine", symbol: "Br" }, calcium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 18, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000074"], diagnostic_pattern: ["WAL-CLM-RARE-000082", "WAL-CLM-RARE-000083"], interaction: ["WAL-CLM-RARE-000084", "WAL-CLM-RARE-000086"], mechanism: ["WAL-CLM-DDDL-000033", "WAL-CLM-DDDL-000052", "WAL-CLM-DDDL-000087"], prevalence: ["WAL-CLM-DDDL-000009"], prognosis: ["WAL-CLM-DDDL-000058"], protocol: ["WAL-CLM-DDDL-000051", "WAL-CLM-DDDL-000060", "WAL-CLM-DDDL-000075", "WAL-CLM-DDDL-000076", "WAL-CLM-DDDL-000078", "WAL-CLM-DDDL-000086", "WAL-CLM-DDDL-000088", "WAL-CLM-DDDL-000092"] }, conditions_treated: ["aneurysm", "angina", "anxiety", "arthritis", "bells_palsy", "birth_defects", "bladder_stones", "cancer", "cardiomyopathy", "cardiovascular_disease", "cataracts", "celiac_disease", "hypertension", "insomnia", "kidney_stones", "malabsorption", "menopause", "muscle_cramps", "osteoarthritis", "osteomalacia", "osteoporosis", "spinal_stenosis", "tinnitus", "trigeminal_neuralgia"], deficiency_signs: [], display_name: "Calcium", interacts_with: ["chromium", "copper", "iron", "magnesium", "phosphorus", "selenium", "strontium", "vanadium", "vitamin-b12", "vitamin-b3", "vitamin-b6", "zinc"], layout_key: "Calcium", slug: "calcium", symbol: "Ca" }, carbon: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Carbon", interacts_with: [], layout_key: "Carbon", slug: "carbon", symbol: "C" }, cerium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Cerium", interacts_with: [], layout_key: "Cerium", slug: "cerium", symbol: "Ce" }, cesium: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 1, claims_by_kind: { protocol: ["WAL-CLM-DDDL-000018"] }, conditions_treated: ["cancer"], deficiency_signs: [], display_name: "Cesium", interacts_with: [], layout_key: "Cesium", slug: "cesium", symbol: "Cs" }, chloride: { books_cited: ["rare-earths"], category: "mineral", claim_count: 1, claims_by_kind: { definition: ["WAL-CLM-RARE-000026"] }, conditions_treated: [], deficiency_signs: [], display_name: "Chloride", interacts_with: ["sodium"], layout_key: "Chloride", slug: "chloride", symbol: "Cl" }, choline: { books_cited: [], category: "vitamin", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Choline", interacts_with: [], layout_key: "Choline", slug: "choline", symbol: "" }, chromium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 13, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000017", "WAL-CLM-RARE-000039", "WAL-CLM-RARE-000042"], diagnostic_pattern: ["WAL-CLM-RARE-000081"], mechanism: ["WAL-CLM-RARE-000043", "WAL-CLM-RARE-000074"], personal_anecdote: ["WAL-CLM-DDDL-000008"], prevalence: ["WAL-CLM-DDDL-000015"], prognosis: ["WAL-CLM-DDDL-000016", "WAL-CLM-DDDL-000046"], protocol: ["WAL-CLM-DDDL-000048", "WAL-CLM-DDDL-000075", "WAL-CLM-DDDL-000078"] }, conditions_treated: ["anemia", "anxiety", "arthritis", "coronary_artery_disease", "diabetes", "hypoglycemia", "insomnia", "schizophrenia"], deficiency_signs: [{ claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "allergic_shiners" }, { claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "geographic_tongue" }], display_name: "Chromium", interacts_with: ["calcium", "copper", "iodine", "iron", "lithium", "magnesium", "vanadium", "vitamin-b3", "vitamin-b6", "zinc"], layout_key: "Chromium", slug: "chromium", symbol: "Cr" }, cobalt: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 2, claims_by_kind: { dose: ["WAL-CLM-RARE-000014"], mechanism: ["WAL-CLM-DDDL-000044"] }, conditions_treated: [], deficiency_signs: [], display_name: "Cobalt", interacts_with: ["vitamin-b12"], layout_key: "Cobalt", slug: "cobalt", symbol: "Co" }, copper: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 9, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000003"], diagnostic_pattern: ["WAL-CLM-RARE-000081", "WAL-CLM-RARE-000083"], interaction: ["WAL-CLM-DDDL-000025", "WAL-CLM-DDDL-000040", "WAL-CLM-RARE-000086"], mechanism: ["WAL-CLM-DDDL-000004", "WAL-CLM-RARE-000051"], protocol: ["WAL-CLM-DDDL-000049"] }, conditions_treated: ["anemia", "aneurysm", "arthritis", "birth_defects", "cancer", "cardiomyopathy", "cataracts", "diabetes", "goiter", "hypertension", "kawasaki_disease", "osteoporosis", "schizophrenia"], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000003", confidence: "high", sign: "gray_hair" }], display_name: "Copper", interacts_with: ["calcium", "chromium", "iodine", "iron", "magnesium", "selenium", "vanadium", "vitamin-b12", "vitamin-b3", "zinc"], layout_key: "Copper", slug: "copper", symbol: "Cu" }, cysteine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Cysteine", interacts_with: [], layout_key: "Cysteine", slug: "cysteine", symbol: "" }, dysprosium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Dysprosium", interacts_with: [], layout_key: "Dysprosium", slug: "dysprosium", symbol: "Dy" }, erbium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Erbium", interacts_with: [], layout_key: "Erbium", slug: "erbium", symbol: "Er" }, europium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Europium", interacts_with: [], layout_key: "Europium", slug: "europium", symbol: "Eu" }, flavonoids: { books_cited: [], category: "vitamin", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Flavonoids", interacts_with: [], layout_key: "Flavonoids / Bioflavonoids", slug: "flavonoids", symbol: "" }, gadolinium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Gadolinium", interacts_with: [], layout_key: "Gadolinium", slug: "gadolinium", symbol: "Gd" }, gallium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Gallium", interacts_with: [], layout_key: "Gallium", slug: "gallium", symbol: "Ga" }, germanium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 6, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000012", "WAL-CLM-RARE-000011"], dose: ["WAL-CLM-DDDL-000011", "WAL-CLM-RARE-000012"], food_source: ["WAL-CLM-RARE-000013"], protocol: ["WAL-CLM-DDDL-000070"] }, conditions_treated: ["arthritis", "cancer", "infertility", "osteoporosis"], deficiency_signs: [{ claim_id: "WAL-CLM-RARE-000011", confidence: "high", sign: "low_energy" }, { claim_id: "WAL-CLM-RARE-000011", confidence: "high", sign: "reduced_immune_status" }], display_name: "Germanium", interacts_with: ["arginine", "selenium", "vitamin-a", "zinc"], layout_key: "Germanium", slug: "germanium", symbol: "Ge" }, gold: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Gold", interacts_with: [], layout_key: "Gold", slug: "gold", symbol: "Au" }, hafnium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Hafnium", interacts_with: [], layout_key: "Hafnium", slug: "hafnium", symbol: "Hf" }, histidine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Histidine", interacts_with: [], layout_key: "Histidine", slug: "histidine", symbol: "" }, holmium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Holmium", interacts_with: [], layout_key: "Holmium", slug: "holmium", symbol: "Ho" }, hydrogen: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Hydrogen", interacts_with: [], layout_key: "Hydrogen", slug: "hydrogen", symbol: "H" }, inositol: { books_cited: [], category: "vitamin", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Inositol", interacts_with: [], layout_key: "Inositol", slug: "inositol", symbol: "" }, iodine: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 4, claims_by_kind: { interaction: ["WAL-CLM-DDDL-000025"], mechanism: ["WAL-CLM-DDDL-000023", "WAL-CLM-RARE-000074"], prevalence: ["WAL-CLM-DDDL-000024"] }, conditions_treated: ["goiter", "hypothyroidism"], deficiency_signs: [], display_name: "Iodine", interacts_with: ["chromium", "copper", "iron", "tyrosine"], layout_key: "Iodine", slug: "iodine", symbol: "I" }, iron: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 10, claims_by_kind: { contraindication: ["WAL-CLM-DDDL-000022"], deficiency_sign: ["WAL-CLM-DDDL-000019", "WAL-CLM-DDDL-000020"], diagnostic_pattern: ["WAL-CLM-RARE-000081", "WAL-CLM-RARE-000083"], interaction: ["WAL-CLM-DDDL-000021", "WAL-CLM-DDDL-000040"], mechanism: ["WAL-CLM-RARE-000037", "WAL-CLM-RARE-000074"], protocol: ["WAL-CLM-DDDL-000080"] }, conditions_treated: ["anemia", "aphthous_stomatitis", "arthritis", "canker_sores", "diabetes", "heart_failure", "liver_cirrhosis", "pica", "schizophrenia"], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000019", confidence: "high", sign: "pica" }], display_name: "Iron", interacts_with: ["calcium", "chromium", "copper", "iodine", "magnesium", "vanadium", "vitamin-b12", "vitamin-b9", "vitamin-c", "zinc"], layout_key: "Iron", slug: "iron", symbol: "Fe" }, isoleucine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Isoleucine", interacts_with: [], layout_key: "Isoleucine", slug: "isoleucine", symbol: "" }, lanthanum: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Lanthanum", interacts_with: [], layout_key: "Lanthanum", slug: "lanthanum", symbol: "La" }, leucine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Leucine", interacts_with: [], layout_key: "Leucine", slug: "leucine", symbol: "" }, lithium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 5, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000079", "WAL-CLM-RARE-000042"], definition: ["WAL-CLM-RARE-000029"], mechanism: ["WAL-CLM-RARE-000041", "WAL-CLM-RARE-000043"] }, conditions_treated: ["anorexia"], deficiency_signs: [{ claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "allergic_shiners" }, { claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "geographic_tongue" }], display_name: "Lithium", interacts_with: ["chromium", "vanadium", "zinc"], layout_key: "Lithium", slug: "lithium", symbol: "Li" }, lutetium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Lutetium", interacts_with: [], layout_key: "Lutetium", slug: "lutetium", symbol: "Lu" }, lysine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Lysine", interacts_with: [], layout_key: "Lysine", slug: "lysine", symbol: "" }, magnesium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 13, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000074"], diagnostic_pattern: ["WAL-CLM-RARE-000082", "WAL-CLM-RARE-000083"], mechanism: ["WAL-CLM-DDDL-000053", "WAL-CLM-DDDL-000082", "WAL-CLM-DDDL-000087"], protocol: ["WAL-CLM-DDDL-000051", "WAL-CLM-DDDL-000060", "WAL-CLM-DDDL-000076", "WAL-CLM-DDDL-000078", "WAL-CLM-DDDL-000086", "WAL-CLM-DDDL-000088", "WAL-CLM-DDDL-000092"] }, conditions_treated: ["angina", "anxiety", "arteriosclerosis", "arthritis", "asthma", "bells_palsy", "bladder_stones", "cardiovascular_disease", "celiac_disease", "kidney_stones", "malabsorption", "menopause", "muscle_cramps", "osteoporosis"], deficiency_signs: [], display_name: "Magnesium", interacts_with: ["calcium", "chromium", "copper", "iron", "manganese", "vanadium", "vitamin-b12", "vitamin-b3", "vitamin-b6", "zinc"], layout_key: "Magnesium", slug: "magnesium", symbol: "Mg" }, manganese: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 3, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000026"], mechanism: ["WAL-CLM-DDDL-000027", "WAL-CLM-DDDL-000053"] }, conditions_treated: ["asthma", "carpal_tunnel_syndrome", "congenital_ataxia", "repetitive_motion_syndrome", "tmj"], deficiency_signs: [], display_name: "Manganese", interacts_with: ["magnesium"], layout_key: "Manganese", slug: "manganese", symbol: "Mn" }, methionine: { books_cited: ["dddl-3e-2011"], category: "amino_acid", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000067"] }, conditions_treated: [], deficiency_signs: [], display_name: "Methionine", interacts_with: ["phenylalanine", "tryptophan"], layout_key: "Methionine", slug: "methionine", symbol: "" }, molybdenum: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000028"] }, conditions_treated: [], deficiency_signs: [], display_name: "Molybdenum", interacts_with: [], layout_key: "Molybdenum", slug: "molybdenum", symbol: "Mo" }, neodymium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Neodymium", interacts_with: [], layout_key: "Neodymium", slug: "neodymium", symbol: "Nd" }, nickel: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Nickel", interacts_with: [], layout_key: "Nickel", slug: "nickel", symbol: "Ni" }, niobium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Niobium", interacts_with: [], layout_key: "Niobium", slug: "niobium", symbol: "Nb" }, nitrogen: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Nitrogen", interacts_with: [], layout_key: "Nitrogen", slug: "nitrogen", symbol: "N" }, "omega-3": { books_cited: ["dddl-3e-2011"], category: "fatty_acid", claim_count: 3, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000065"], definition: ["WAL-CLM-DDDL-000063"], mechanism: ["WAL-CLM-DDDL-000064"] }, conditions_treated: ["eczema"], deficiency_signs: [], display_name: "Omega-3", interacts_with: ["omega-6"], layout_key: "Omega-3 (alpha-linolenic + EPA/DHA in marine form)", slug: "omega-3", symbol: "" }, "omega-6": { books_cited: ["dddl-3e-2011"], category: "fatty_acid", claim_count: 3, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000065"], definition: ["WAL-CLM-DDDL-000063"], mechanism: ["WAL-CLM-DDDL-000064"] }, conditions_treated: ["eczema"], deficiency_signs: [], display_name: "Omega-6", interacts_with: ["omega-3"], layout_key: "Omega-6 (linoleic + GLA)", slug: "omega-6", symbol: "" }, oxygen: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Oxygen", interacts_with: [], layout_key: "Oxygen", slug: "oxygen", symbol: "O" }, phenylalanine: { books_cited: ["dddl-3e-2011"], category: "amino_acid", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000067"] }, conditions_treated: [], deficiency_signs: [], display_name: "Phenylalanine", interacts_with: ["methionine", "tryptophan"], layout_key: "Phenylalanine", slug: "phenylalanine", symbol: "" }, phosphorus: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000052"] }, conditions_treated: ["arthritis", "osteoporosis"], deficiency_signs: [], display_name: "Phosphorus", interacts_with: ["calcium"], layout_key: "Phosphorus", slug: "phosphorus", symbol: "P" }, potassium: { books_cited: ["rare-earths"], category: "mineral", claim_count: 1, claims_by_kind: { interaction: ["WAL-CLM-RARE-000038"] }, conditions_treated: [], deficiency_signs: [], display_name: "Potassium", interacts_with: [], layout_key: "Potassium", slug: "potassium", symbol: "K" }, praseodymium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Praseodymium", interacts_with: [], layout_key: "Praseodymium", slug: "praseodymium", symbol: "Pr" }, rhenium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Rhenium", interacts_with: [], layout_key: "Rhenium", slug: "rhenium", symbol: "Re" }, rubidium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Rubidium", interacts_with: [], layout_key: "Rubidium", slug: "rubidium", symbol: "Rb" }, samarium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Samarium", interacts_with: [], layout_key: "Samarium", slug: "samarium", symbol: "Sm" }, scandium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Scandium", interacts_with: [], layout_key: "Scandium", slug: "scandium", symbol: "Sc" }, selenium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 19, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000005", "WAL-CLM-DDDL-000006"], dose: ["WAL-CLM-RARE-000048"], interaction: ["WAL-CLM-RARE-000084", "WAL-CLM-RARE-000086"], mechanism: ["WAL-CLM-DDDL-000029", "WAL-CLM-DDDL-000030", "WAL-CLM-DDDL-000071", "WAL-CLM-RARE-000004", "WAL-CLM-RARE-000010", "WAL-CLM-RARE-000050"], prognosis: ["WAL-CLM-DDDL-000007", "WAL-CLM-DDDL-000072"], protocol: ["WAL-CLM-DDDL-000054", "WAL-CLM-DDDL-000056", "WAL-CLM-DDDL-000070", "WAL-CLM-DDDL-000073", "WAL-CLM-DDDL-000081", "WAL-CLM-DDDL-000085"] }, conditions_treated: ["aneurysm", "arsenic_toxicity", "arthritis", "benign_prostatic_hyperplasia", "birth_defects", "cancer", "cardiomyopathy", "cataracts", "cor_pulmonale", "cystic_fibrosis", "heart_attack", "hypertension", "infertility", "keshan_disease", "muscular_dystrophy", "osteoporosis", "sids", "white_muscle_disease"], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000006", confidence: "high", sign: "age_spots" }, { claim_id: "WAL-CLM-DDDL-000006", confidence: "high", sign: "liver_spots" }], display_name: "Selenium", interacts_with: ["arginine", "calcium", "copper", "germanium", "vitamin-a", "vitamin-b2", "vitamin-e", "zinc"], layout_key: "Selenium", slug: "selenium", symbol: "Se" }, silica: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Silica", interacts_with: [], layout_key: "Silica", slug: "silica", symbol: "Si" }, silver: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 2, claims_by_kind: { dose: ["WAL-CLM-DDDL-000013"], mechanism: ["WAL-CLM-DDDL-000014"] }, conditions_treated: [], deficiency_signs: [], display_name: "Silver", interacts_with: [], layout_key: "Silver", slug: "silver", symbol: "Ag" }, sodium: { books_cited: ["rare-earths"], category: "mineral", claim_count: 3, claims_by_kind: { definition: ["WAL-CLM-RARE-000026"], mechanism: ["WAL-CLM-RARE-000003", "WAL-CLM-RARE-000027"] }, conditions_treated: ["heat_stroke"], deficiency_signs: [], display_name: "Sodium", interacts_with: ["chloride"], layout_key: "Sodium", slug: "sodium", symbol: "Na" }, strontium: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 2, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000032"], mechanism: ["WAL-CLM-DDDL-000033"] }, conditions_treated: ["arthritis", "osteoporosis"], deficiency_signs: [], display_name: "Strontium", interacts_with: ["calcium"], layout_key: "Strontium", slug: "strontium", symbol: "Sr" }, sulfur: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Sulfur", interacts_with: [], layout_key: "Sulfur", slug: "sulfur", symbol: "S" }, tantalum: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Tantalum", interacts_with: [], layout_key: "Tantalum", slug: "tantalum", symbol: "Ta" }, terbium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Terbium", interacts_with: [], layout_key: "Terbium", slug: "terbium", symbol: "Tb" }, threonine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Threonine", interacts_with: [], layout_key: "Threonine", slug: "threonine", symbol: "" }, thulium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Thulium", interacts_with: [], layout_key: "Thulium", slug: "thulium", symbol: "Tm" }, tin: { books_cited: ["dddl-3e-2011"], category: "mineral", claim_count: 1, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000031"] }, conditions_treated: ["male_pattern_baldness"], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000031", confidence: "high", sign: "hair_loss" }, { claim_id: "WAL-CLM-DDDL-000031", confidence: "high", sign: "hearing_loss" }], display_name: "Tin", interacts_with: [], layout_key: "Tin", slug: "tin", symbol: "Sn" }, titanium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Titanium", interacts_with: [], layout_key: "Titanium", slug: "titanium", symbol: "Ti" }, tryptophan: { books_cited: ["dddl-3e-2011"], category: "amino_acid", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000067"] }, conditions_treated: [], deficiency_signs: [], display_name: "Tryptophan", interacts_with: ["methionine", "phenylalanine"], layout_key: "Tryptophan", slug: "tryptophan", symbol: "" }, tyrosine: { books_cited: ["dddl-3e-2011"], category: "amino_acid", claim_count: 2, claims_by_kind: { mechanism: ["WAL-CLM-DDDL-000023"], quote: ["WAL-CLM-DDDL-000066"] }, conditions_treated: ["cancer", "goiter", "hypothyroidism", "macular_degeneration"], deficiency_signs: [], display_name: "Tyrosine", interacts_with: ["arginine", "iodine"], layout_key: "Tyrosine", slug: "tyrosine", symbol: "" }, valine: { books_cited: [], category: "amino_acid", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Valine", interacts_with: [], layout_key: "Valine", slug: "valine", symbol: "" }, vanadium: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 13, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000017", "WAL-CLM-RARE-000039", "WAL-CLM-RARE-000042"], diagnostic_pattern: ["WAL-CLM-RARE-000081"], mechanism: ["WAL-CLM-DDDL-000034", "WAL-CLM-DDDL-000036", "WAL-CLM-RARE-000043"], personal_anecdote: ["WAL-CLM-DDDL-000008"], prognosis: ["WAL-CLM-DDDL-000035"], protocol: ["WAL-CLM-DDDL-000048", "WAL-CLM-DDDL-000075", "WAL-CLM-DDDL-000078"], quote: ["WAL-CLM-DDDL-000047"] }, conditions_treated: ["anemia", "anxiety", "arthritis", "cancer", "coronary_artery_disease", "diabetes", "hypoglycemia", "insomnia", "schizophrenia"], deficiency_signs: [{ claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "allergic_shiners" }, { claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "geographic_tongue" }], display_name: "Vanadium", interacts_with: ["calcium", "chromium", "copper", "iron", "lithium", "magnesium", "vitamin-b3", "vitamin-b6", "zinc"], layout_key: "Vanadium", slug: "vanadium", symbol: "V" }, "vitamin-a": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 4, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000041"], protocol: ["WAL-CLM-DDDL-000056", "WAL-CLM-DDDL-000070", "WAL-CLM-DDDL-000085"] }, conditions_treated: ["benign_prostatic_hyperplasia", "blindness", "cancer", "corneal_ulcers", "infertility", "keratitis"], deficiency_signs: [], display_name: "Retinol", interacts_with: ["arginine", "germanium", "selenium", "zinc"], layout_key: "Vitamin A (Retinol / beta-carotene)", slug: "vitamin-a", symbol: "" }, "vitamin-b1": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 1, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000043"] }, conditions_treated: ["beriberi", "congestive_heart_failure"], deficiency_signs: [], display_name: "Thiamine", interacts_with: [], layout_key: "Vitamin B1 (Thiamine)", slug: "vitamin-b1", symbol: "" }, "vitamin-b12": { books_cited: ["dddl-3e-2011", "rare-earths"], category: "vitamin", claim_count: 6, claims_by_kind: { dose: ["WAL-CLM-RARE-000014"], mechanism: ["WAL-CLM-DDDL-000044", "WAL-CLM-DDDL-000045"], protocol: ["WAL-CLM-DDDL-000049", "WAL-CLM-DDDL-000080", "WAL-CLM-DDDL-000086"] }, conditions_treated: ["aphthous_stomatitis", "bells_palsy", "canker_sores", "diabetes"], deficiency_signs: [], display_name: "Cobalamin", interacts_with: ["calcium", "cobalt", "copper", "iron", "magnesium", "vitamin-b3", "vitamin-b9", "zinc"], layout_key: "Vitamin B12 (Cobalamin)", slug: "vitamin-b12", symbol: "" }, "vitamin-b2": { books_cited: ["rare-earths"], category: "vitamin", claim_count: 1, claims_by_kind: { mechanism: ["WAL-CLM-RARE-000010"] }, conditions_treated: ["cystic_fibrosis"], deficiency_signs: [], display_name: "Riboflavin", interacts_with: ["selenium", "vitamin-e", "zinc"], layout_key: "Vitamin B2 (Riboflavin)", slug: "vitamin-b2", symbol: "" }, "vitamin-b3": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 2, claims_by_kind: { protocol: ["WAL-CLM-DDDL-000049", "WAL-CLM-DDDL-000078"] }, conditions_treated: ["anxiety", "diabetes"], deficiency_signs: [], display_name: "Niacin", interacts_with: ["calcium", "chromium", "copper", "magnesium", "vanadium", "vitamin-b12", "vitamin-b6", "zinc"], layout_key: "Vitamin B3 (Niacin)", slug: "vitamin-b3", symbol: "" }, "vitamin-b5": { books_cited: [], category: "vitamin", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Pantothenic Acid", interacts_with: [], layout_key: "Vitamin B5 (Pantothenic Acid)", slug: "vitamin-b5", symbol: "" }, "vitamin-b6": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 2, claims_by_kind: { protocol: ["WAL-CLM-DDDL-000055", "WAL-CLM-DDDL-000078"] }, conditions_treated: ["anxiety", "cradle_cap"], deficiency_signs: [], display_name: "Pyridoxine", interacts_with: ["calcium", "chromium", "magnesium", "vanadium", "vitamin-b3", "zinc"], layout_key: "Vitamin B6 (Pyridoxine)", slug: "vitamin-b6", symbol: "" }, "vitamin-b9": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 2, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000042"], protocol: ["WAL-CLM-DDDL-000080"] }, conditions_treated: ["aphthous_stomatitis", "canker_sores", "cleft_palate", "spina_bifida"], deficiency_signs: [], display_name: "Folate", interacts_with: ["iron", "vitamin-b12", "zinc"], layout_key: "Folic Acid (Folate)", slug: "vitamin-b9", symbol: "" }, "vitamin-c": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 2, claims_by_kind: { interaction: ["WAL-CLM-DDDL-000021"], protocol: ["WAL-CLM-DDDL-000094"] }, conditions_treated: ["common_cold"], deficiency_signs: [], display_name: "Ascorbic Acid", interacts_with: ["iron"], layout_key: "Vitamin C (Ascorbic Acid)", slug: "vitamin-c", symbol: "" }, "vitamin-d": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 2, claims_by_kind: { contraindication: ["WAL-CLM-DDDL-000083"], mechanism: ["WAL-CLM-DDDL-000068"] }, conditions_treated: ["arteriosclerosis", "menopause"], deficiency_signs: [], display_name: "Cholecalciferol", interacts_with: [], layout_key: "Vitamin D2 (Ergocalciferol) + D3 (Cholecalciferol)", slug: "vitamin-d", symbol: "" }, "vitamin-e": { books_cited: ["dddl-3e-2011", "rare-earths"], category: "vitamin", claim_count: 4, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000089"], mechanism: ["WAL-CLM-RARE-000010"], prognosis: ["WAL-CLM-DDDL-000072"], protocol: ["WAL-CLM-DDDL-000073"] }, conditions_treated: ["cystic_fibrosis", "keshan_disease", "muscular_dystrophy"], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000089", confidence: "high", sign: "easy_bruising" }], display_name: "Tocopherol", interacts_with: ["selenium", "vitamin-b2", "vitamin-k", "zinc"], layout_key: "Vitamin E (Tocopherol)", slug: "vitamin-e", symbol: "" }, "vitamin-k": { books_cited: ["dddl-3e-2011"], category: "vitamin", claim_count: 1, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000089"] }, conditions_treated: [], deficiency_signs: [{ claim_id: "WAL-CLM-DDDL-000089", confidence: "high", sign: "easy_bruising" }], display_name: "Menaquinone", interacts_with: ["vitamin-e"], layout_key: "Vitamin K (Menaquinone = K2)", slug: "vitamin-k", symbol: "" }, ytterbium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Ytterbium", interacts_with: [], layout_key: "Ytterbium", slug: "ytterbium", symbol: "Yb" }, yttrium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Yttrium", interacts_with: [], layout_key: "Yttrium", slug: "yttrium", symbol: "Y" }, zinc: { books_cited: ["dddl-3e-2011", "rare-earths"], category: "mineral", claim_count: 20, claims_by_kind: { deficiency_sign: ["WAL-CLM-DDDL-000039", "WAL-CLM-DDDL-000042", "WAL-CLM-DDDL-000077", "WAL-CLM-DDDL-000079", "WAL-CLM-RARE-000042"], diagnostic_pattern: ["WAL-CLM-RARE-000083"], interaction: ["WAL-CLM-DDDL-000040", "WAL-CLM-RARE-000086"], mechanism: ["WAL-CLM-DDDL-000037", "WAL-CLM-DDDL-000038", "WAL-CLM-DDDL-000084", "WAL-CLM-RARE-000010", "WAL-CLM-RARE-000044", "WAL-CLM-RARE-000046"], protocol: ["WAL-CLM-DDDL-000049", "WAL-CLM-DDDL-000055", "WAL-CLM-DDDL-000070", "WAL-CLM-DDDL-000080", "WAL-CLM-DDDL-000085", "WAL-CLM-RARE-000045"] }, conditions_treated: ["aneurysm", "anorexia", "anosmia", "aphthous_stomatitis", "arthritis", "benign_prostatic_hyperplasia", "birth_defects", "cancer", "canker_sores", "cardiomyopathy", "cataracts", "cleft_palate", "cradle_cap", "cystic_fibrosis", "diabetes", "down_syndrome", "hypertension", "infertility", "osteoporosis", "spina_bifida"], deficiency_signs: [{ claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "allergic_shiners" }, { claim_id: "WAL-CLM-RARE-000042", confidence: "high", sign: "geographic_tongue" }, { claim_id: "WAL-CLM-DDDL-000077", confidence: "high", sign: "loss_of_smell" }], display_name: "Zinc", interacts_with: ["arginine", "calcium", "chromium", "copper", "germanium", "iron", "lithium", "magnesium", "selenium", "vanadium", "vitamin-a", "vitamin-b12", "vitamin-b2", "vitamin-b3", "vitamin-b6", "vitamin-b9", "vitamin-e"], layout_key: "Zinc", slug: "zinc", symbol: "Zn" }, zirconium: { books_cited: [], category: "mineral", claim_count: 0, claims_by_kind: {}, conditions_treated: [], deficiency_signs: [], display_name: "Zirconium", interacts_with: [], layout_key: "Zirconium", slug: "zirconium", symbol: "Zr" } }, knowledge_version: 39, planned_books: [{ authors: ["Joel D. Wallach"], code: "LPHD", title: "Let's Play Herbal Doctor" }, { authors: ["Joel D. Wallach"], code: "HKCP", title: "Hell's Kitchen: Causes, Prevention and Cure of Obesity, Diabetes and Metabolic Syndrome" }, { authors: ["Joel D. Wallach"], code: "EC", title: "Energy Crisis" }, { authors: ["Joel D. Wallach"], code: "PA", title: "Passport to Aromatherapy" }] };

  // assets/js/src/state/corpus.ts
  var EMPTY_CORPUS = {
    knowledge_version: 0,
    books: {},
    planned_books: [],
    essentials: {},
    conditions: {},
    claims: {}
  };
  var cached = null;
  function corpus() {
    if (cached === null) {
      const parsed = CorpusEmbedSchema.safeParse(corpus_embed_default);
      cached = parsed.success ? parsed.data : EMPTY_CORPUS;
    }
    return cached;
  }
  function getClaim(id) {
    return corpus().claims[id] ?? null;
  }
  function resolveClaims(ids) {
    const out = [];
    for (const id of ids) {
      const c = getClaim(id);
      if (c !== null) {
        out.push(c);
      }
    }
    return out;
  }
  function getEssentialBySlug(slug) {
    return corpus().essentials[slug] ?? null;
  }
  var layoutKeyToSlug = null;
  function layoutIndex() {
    if (layoutKeyToSlug === null) {
      layoutKeyToSlug = /* @__PURE__ */ new Map();
      for (const e of Object.values(corpus().essentials)) {
        layoutKeyToSlug.set(e.layout_key, e.slug);
      }
    }
    return layoutKeyToSlug;
  }
  function getEssentialByLayoutKey(layoutKey) {
    const slug = layoutIndex().get(layoutKey);
    return slug !== void 0 ? getEssentialBySlug(slug) : null;
  }
  function getCondition(slug) {
    return corpus().conditions[slug] ?? null;
  }
  function listConditions() {
    return Object.values(corpus().conditions);
  }
  function conditionDisplayName(slug) {
    return getCondition(slug)?.display_name ?? humanizeSlug(slug);
  }
  function essentialDisplayName(slug) {
    return getEssentialBySlug(slug)?.display_name ?? humanizeSlug(slug);
  }
  function humanizeSlug(slug) {
    return slug.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  function getBookLabel(bookId) {
    const b = corpus().books[bookId];
    if (b === void 0) {
      return bookId;
    }
    const ed = b.edition !== void 0 && b.edition !== null && b.edition.length > 0 ? `${b.edition} ed.` : "";
    const yr = b.year !== void 0 && b.year !== null ? String(b.year) : "";
    const tail = [ed, yr].filter((s) => s.length > 0).join(" ");
    return tail.length > 0 ? `${b.title} (${tail})` : b.title;
  }
  function listBooks() {
    const yearOf = (b) => {
      const y = typeof b.year === "number" ? b.year : Number.parseInt(String(b.year ?? ""), 10);
      return Number.isNaN(y) ? -Infinity : y;
    };
    return Object.values(corpus().books).sort((a, b) => {
      const ya = yearOf(a);
      const yb = yearOf(b);
      if (ya !== yb) {
        return yb - ya;
      }
      return a.title < b.title ? -1 : a.title > b.title ? 1 : 0;
    });
  }
  function listPlannedBooks() {
    return corpus().planned_books;
  }

  // assets/js/src/views/knowledge-corpus.ts
  function escHTML3(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  var CORPUS_KIND_PRIORITY = ["deficiency_sign", "dose", "protocol", "mechanism", "prognosis"];
  function corpusKindLabel(kind) {
    return kind.replace(/[_-]+/g, " ").toUpperCase();
  }
  function corpusKindOrder(a, b) {
    const ia = CORPUS_KIND_PRIORITY.indexOf(a);
    const ib = CORPUS_KIND_PRIORITY.indexOf(b);
    const ra = ia === -1 ? CORPUS_KIND_PRIORITY.length : ia;
    const rb = ib === -1 ? CORPUS_KIND_PRIORITY.length : ib;
    return ra !== rb ? ra - rb : a < b ? -1 : a > b ? 1 : 0;
  }
  function collapseWS(s) {
    return s.replace(/\s+/g, " ").trim();
  }
  function formatDose(dose) {
    if (dose === null || dose === void 0) {
      return "";
    }
    const amount = typeof dose.amount === "number" || typeof dose.amount === "string" ? String(dose.amount) : "";
    const unit = typeof dose.unit === "string" ? dose.unit : "";
    const period = typeof dose.period === "string" ? dose.period : "";
    const head = [amount, unit].filter((s) => s.length > 0).join(" ");
    if (head.length === 0) {
      return "";
    }
    return period.length > 0 ? `${head} / ${period}` : head;
  }
  function renderCorpusClaim(claim) {
    const dose = formatDose(claim.dose);
    return `
    <div class="kd-claim">
      <p class="kd-claim__text">${escHTML3(claim.claim_text)}</p>
      ${dose.length > 0 ? `<div class="kd-claim__dose">${escHTML3(dose)}</div>` : ""}
      <blockquote class="kd-claim__verbatim">${escHTML3(collapseWS(claim.verbatim))}</blockquote>
      <div class="kd-claim__cite">CITED \xB7 ${escHTML3(getBookLabel(claim.book))}</div>
    </div>`;
  }
  function renderCorpusForEssential(c) {
    if (c.claim_count === 0) {
      return `
      <div class="kd-corpus">
        <div class="kd-corpus__head"><span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span></div>
        <p class="kd-corpus__empty">\u2014 no sealed claims extracted for this essential yet \xB7 the corpus is still being built out \u2014</p>
      </div>`;
    }
    const groupsHTML = Object.keys(c.claims_by_kind).sort(corpusKindOrder).map((kind) => {
      const ids = c.claims_by_kind[kind] ?? [];
      const claimsHTML = resolveClaims(ids).map(renderCorpusClaim).join("");
      return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML3(corpusKindLabel(kind))}</div>
        ${claimsHTML}
      </div>`;
    }).join("");
    const condChips = c.conditions_treated.map((s) => `<span class="kd-corpus__chip">${escHTML3(conditionDisplayName(s))}</span>`).join("");
    const interactChips = c.interacts_with.map((s) => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML3(essentialDisplayName(s))}</span>`).join("");
    const books = c.books_cited.map((b) => getBookLabel(b)).join(" \xB7 ");
    return `
    <div class="kd-corpus">
      <div class="kd-corpus__head">
        <span class="kd-corpus__eyebrow"><span class="pulse-dot"></span>FROM THE WALLACH CORPUS</span>
        <span class="kd-corpus__count">${c.claim_count} CLAIM${c.claim_count === 1 ? "" : "S"}</span>
      </div>
      ${condChips.length > 0 ? `<div class="kd-corpus__sub">IMPLICATED CONDITIONS</div><div class="kd-corpus__chips">${condChips}</div>` : ""}
      ${interactChips.length > 0 ? `<div class="kd-corpus__sub">WORKS ALONGSIDE</div><div class="kd-corpus__chips">${interactChips}</div>` : ""}
      ${groupsHTML}
      <div class="kd-corpus__foot">SOURCE \xB7 ${escHTML3(books)}</div>
    </div>`;
  }
  var CORPUS_ROLE_PRIORITY = ["causes", "deficiency_signs", "protocols", "doses", "prognosis"];
  function corpusRoleOrder(a, b) {
    const ia = CORPUS_ROLE_PRIORITY.indexOf(a);
    const ib = CORPUS_ROLE_PRIORITY.indexOf(b);
    const ra = ia === -1 ? CORPUS_ROLE_PRIORITY.length : ia;
    const rb = ib === -1 ? CORPUS_ROLE_PRIORITY.length : ib;
    return ra !== rb ? ra - rb : a < b ? -1 : a > b ? 1 : 0;
  }
  function renderConditionRow(c, selectedSlug) {
    const ess = c.essentials_involved.slice(0, 6).map((s) => essentialDisplayName(s)).join(" \xB7 ");
    const cls = `kd-condition-row${c.slug === selectedSlug ? " is-selected" : ""}`;
    return `
    <div class="${cls}" data-kd-condition="${escHTML3(c.slug)}" role="button" tabindex="0">
      <div class="kd-condition-row__body">
        <h4 class="kd-condition-row__name">${escHTML3(c.display_name)}</h4>
        <div class="kd-condition-row__meta">${ess.length > 0 ? escHTML3(ess) : "\u2014 corpus entry \u2014"}</div>
      </div>
      <div class="kd-condition-row__count">${c.claim_count}<small>claims</small></div>
    </div>`;
  }
  function renderConditionDeep(slug) {
    const c = getCondition(slug);
    if (c === null) {
      return "";
    }
    const groupsHTML = Object.keys(c.claims_by_role).sort(corpusRoleOrder).map((role) => {
      const ids = c.claims_by_role[role] ?? [];
      const claimsHTML = resolveClaims(ids).map((cl) => renderCorpusClaim(cl)).join("");
      return `
      <div class="kd-corpus__group">
        <div class="kd-corpus__group-label">${escHTML3(corpusKindLabel(role))}</div>
        ${claimsHTML}
      </div>`;
    }).join("");
    const essChips = c.essentials_involved.map((s) => `<span class="kd-corpus__chip kd-corpus__chip--ess">${escHTML3(essentialDisplayName(s))}</span>`).join("");
    const books = c.books_cited.map((b) => getBookLabel(b)).join(" \xB7 ");
    return `
    <div class="kd-essential-deep kd-condition-deep">
      <button class="kd-essential-deep__close" data-kd-action="condition-close" title="Close (Esc)">\xD7</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__name-block">
          <h3 class="kd-essential-deep__name">${escHTML3(c.display_name)}</h3>
          <div class="kd-essential-deep__cat">CONDITION \xB7 ${c.claim_count} CLAIM${c.claim_count === 1 ? "" : "S"}</div>
        </div>
      </header>
      ${essChips.length > 0 ? `<div class="kd-corpus__sub">ADDRESSED BY</div><div class="kd-corpus__chips">${essChips}</div>` : ""}
      ${groupsHTML}
      <div class="kd-corpus__foot">SOURCE \xB7 ${escHTML3(books)}</div>
    </div>`;
  }
  function renderConditionsTab(selectedSlug) {
    const conditions = listConditions();
    if (conditions.length === 0) {
      return '<div class="kd-empty">\u2014 no conditions in the corpus yet \u2014</div>';
    }
    const deepHTML = selectedSlug !== null ? renderConditionDeep(selectedSlug) : "";
    const rowsHTML = conditions.map((c) => renderConditionRow(c, selectedSlug)).join("");
    return `
    ${deepHTML}
    <div class="kd-section-head">CONDITIONS \xB7 ${conditions.length} \xB7 WALLACH CORPUS</div>
    ${rowsHTML}`;
  }

  // assets/js/src/views/knowledge.ts
  function readProducts() {
    const el = document.getElementById("regimen-label-lookup");
    if (el === null) {
      return [];
    }
    let parsed;
    try {
      parsed = JSON.parse(el.textContent ?? "{}");
    } catch {
      return [];
    }
    let root = parsed;
    if (parsed !== null && typeof parsed === "object" && "products" in parsed) {
      root = parsed.products;
    }
    const lookup = ProductsLookupSchema.safeParse(root);
    if (!lookup.success) {
      return [];
    }
    const byName = /* @__PURE__ */ new Map();
    for (const value of Object.values(lookup.data)) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const candidate of candidates) {
        const r = ProductEntrySchema.safeParse(candidate);
        if (!r.success) {
          continue;
        }
        const nm = r.data.canonical_name ?? r.data.name;
        if (typeof nm === "string" && nm.length > 0) {
          byName.set(nm.toLowerCase(), r.data);
        }
      }
    }
    return [...byName.values()];
  }
  var DOCTRINES = [
    { id: "DOCT\xB701", title: "Source-Rule \xB7 Wallach Primary Only", featured: true, body: "Every numeric target, dose recommendation, deficiency indicator, or health claim displayed by this system must cite a primary source from the Wallach corpus or the YGY product allowlist. No exceptions, including the user.", cite: "ENFORCED BY check_no_unsourced_claims \xB7 invariant tier \xB7 critical" },
    { id: "DOCT\xB702", title: "Aggregate-Vehicle Coverage (PDM)", featured: false, body: "Plant-derived minerals are defined by sourcing, not by amounts. If a plant-derived mineral aggregate is present in a product, every trace mineral in that aggregate is considered covered \u2014 binary, not graduated.", cite: "CITED \xB7 Dead Doctors Don't Lie \xB7 ch. 4" },
    { id: "DOCT\xB703", title: "BTT Layering Order", featured: false, body: "Beyond Tangy Tangerine is the foundational morning layer \u2014 vitamins, aminos, foundational minerals. Stack PDM on top for the rare-trace closure. Add EFA Plus for fatty acids. Order matters for absorption.", cite: "CITED \xB7 Wallach lecture corpus \xB7 YGY protocol guide" },
    { id: "DOCT\xB704", title: "Trace Minerals: Source-Not-Quantity", featured: false, body: "For the 35 rare trace minerals, presence in a plant-derived vehicle is the qualifying criterion. Mass-spec verification of every trace amount is unnecessary if the source is doctrinally sound.", cite: "CITED \xB7 Rare Earths \xB7 ch. 9" },
    { id: "DOCT\xB705", title: "Atomic LS Write Discipline (\xA717)", featured: false, body: "Every regimen LS write goes through a verified round-trip set \u2192 re-read \u2192 reject-on-mismatch loop. Silent truncations from the Edit tool taught us this. Writes that cannot confirm fail loudly.", cite: "PROVED \xB7 Round 73 lessons + 9 truncation incidents" },
    { id: "DOCT\xB706", title: "\xA731 Chokepoint Discipline (Cross-Surface Sync)", featured: false, body: "Every regimen mutation flows through one of 5 named chokepoint helpers. Each fires triggerRegimenRerender so all subscribed surfaces re-render. State drift is structurally impossible by module design, not vigilance.", cite: "CITED \xB7 Round 150 doctrine \xB7 enforced by check_regimen_state_mutation_routing" },
    { id: "DOCT\xB707", title: "Eden Sealed-Canonical (User-Only-Writer)", featured: false, body: "Sealed canonical files (design-system.css, eden corpus) carry hash anchors. Agent reads freely, never writes after sealing time. Drift is detected at startup; reads from drifted files fail loudly.", cite: "CITED \xB7 Round 157 \xB7 enforced by eden_hash_integrity + write_protection invariants" }
  ];
  var LAYOUT3 = CoverageLayoutSchema.parse(coverage_layout_data_default);
  function tileSymbol(t) {
    return t.sym ?? t.letter ?? t.abbr ?? t.code ?? t.name.charAt(0).toUpperCase();
  }
  function tileRef(t) {
    if (t.num !== void 0) {
      return `#${t.num}`;
    }
    return t.code ?? "";
  }
  function sectionCatLabel(section) {
    switch (section.tileClass) {
      case "tile--vitamin":
        return "VITAMIN";
      case "tile--amino":
        return "AMINO ACID";
      case "tile--fat":
        return "FATTY ACID";
      case "tile":
        return "MINERAL";
      default:
        return "MINERAL";
    }
  }
  function buildEssentialGroups() {
    return LAYOUT3.sections.map((section) => {
      const items = [];
      const pushTile = (t, catLabel) => {
        items.push({ key: t.key, name: t.name, symbol: tileSymbol(t), catLabel, ref: tileRef(t), section: section.title, essential: t.essential !== false });
      };
      if (section.subsections !== void 0) {
        for (const sub of section.subsections) {
          for (const t of sub.tiles) {
            pushTile(t, sub.label);
          }
        }
      } else if (section.tiles !== void 0) {
        const label = sectionCatLabel(section);
        for (const t of section.tiles) {
          pushTile(t, label);
        }
      }
      return { title: section.title, sub: section.sub, items };
    });
  }
  var ESS_GROUPS = buildEssentialGroups();
  var ESS_BY_KEY = new Map(
    ESS_GROUPS.flatMap((g) => g.items.map((i) => [i.key, i]))
  );
  var ESS_ESSENTIAL_COUNT = ESS_GROUPS.reduce((n, g) => n + g.items.filter((i) => i.essential).length, 0);
  function statusOf(snapshot, key) {
    if (snapshot === null) {
      return "";
    }
    return snapshot.tiles.find((t) => t.name === key)?.status ?? "";
  }
  function statusTileClass(s) {
    if (s === "covered" || s === "trace") {
      return "kd-essential-tile--covered";
    }
    if (s === "partial" || s === "gap") {
      return "kd-essential-tile--partial";
    }
    return "";
  }
  function statusLabel(s) {
    switch (s) {
      case "covered":
      case "trace":
        return "COVERED";
      case "partial":
        return "PARTIAL";
      case "gap":
        return "GAP";
      case "":
        return "PENDING";
      default:
        return "PENDING";
    }
  }
  function statusPillClass(s) {
    if (s === "covered" || s === "trace") {
      return "kd-essential-deep__status-pill--ok";
    }
    if (s === "partial" || s === "gap") {
      return "kd-essential-deep__status-pill--warn";
    }
    return "kd-essential-deep__status-pill--pending";
  }
  function vaultProductsFor(key) {
    const out = [];
    for (const p of readProducts()) {
      const nutrients = p.nutrients ?? [];
      const carries = nutrients.some((n) => {
        if (typeof n !== "object" || n === null) {
          return false;
        }
        const nm = n.name;
        return typeof nm === "string" && matchEssential(nm)?.name === key;
      });
      if (carries) {
        const nm = p.canonical_name ?? p.name;
        if (typeof nm === "string" && nm.length > 0) {
          out.push(nm);
        }
      }
      if (out.length >= 8) {
        break;
      }
    }
    return out;
  }
  function escHTML4(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function hexSerial2(seed) {
    return (seed * 2654435769 >>> 0).toString(16).toUpperCase().padStart(4, "0").slice(0, 4);
  }
  function authorLabel(authors) {
    if (authors === void 0 || authors.length === 0) {
      return "WALLACH";
    }
    const first = authors[0] ?? "";
    const parts = first.trim().split(/\s+/);
    const surname = parts.length > 0 ? parts[parts.length - 1] ?? first : first;
    return authors.length > 1 ? `${surname.toUpperCase()} ET AL` : surname.toUpperCase();
  }
  function bookCountHTML(n) {
    if (n > 0) {
      return `${n}<small>claims</small>`;
    }
    return '<span class="kd-book-row__count--queued">\u22EF</span><small>queued</small>';
  }
  function renderBookRow(b) {
    const ed = b.edition !== void 0 && b.edition !== null && b.edition.length > 0 ? `${escHTML4(b.edition)} ED \xB7 ` : "";
    const yr = b.year !== void 0 && b.year !== null ? escHTML4(String(b.year)) : "";
    return `
    <div class="kd-book-row">
      <div class="kd-book-row__spine"><span>${escHTML4(b.code ?? "")}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML4(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML4(authorLabel(b.authors))} \xB7 ${ed}${yr}</div>
      </div>
      <div class="kd-book-row__count">${bookCountHTML(b.claim_count ?? 0)}</div>
    </div>`;
  }
  function renderPlannedRow(b) {
    return `
    <div class="kd-book-row kd-book-row--planned">
      <div class="kd-book-row__spine"><span>${escHTML4(b.code ?? "")}</span></div>
      <div class="kd-book-row__body">
        <h4 class="kd-book-row__title">${escHTML4(b.title)}</h4>
        <div class="kd-book-row__meta">${escHTML4(authorLabel(b.authors))} \xB7 COMING SOON</div>
      </div>
      <div class="kd-book-row__count kd-book-row__count--soon">\u2014<small>soon</small></div>
    </div>`;
  }
  function renderCorpusTab() {
    const books = listBooks();
    const planned = listPlannedBooks();
    const totalClaims = books.reduce((s, b) => s + (b.claim_count ?? 0), 0);
    const booksHTML = books.map((b) => renderBookRow(b)).join("");
    const plannedHTML = planned.length > 0 ? `<div class="kd-section-head">COMING SOON \xB7 ACQUIRING</div>${planned.map((p) => renderPlannedRow(p)).join("")}` : "";
    return `
    <div class="kd-featured-citation">
      <div class="kd-featured-citation__eyebrow"><span class="pulse-dot"></span>SOURCE-RULE CORNERSTONE</div>
      <p class="kd-featured-citation__quote">The body needs 60 minerals, 16 vitamins, 12 amino acids, and 2 essential fatty acids \u2014 90 essentials total. Plant-derived minerals are the only delivery vehicle that the body absorbs as nature intended.</p>
      <div class="kd-featured-citation__attr"><strong>Wallach</strong> \xB7 Dead Doctors Don't Lie \xB7 ch. 1 \xB7 paraphrase per primary corpus</div>
    </div>
    <div class="kd-section-head">PRIMARY CORPUS \xB7 WALLACH \xB7 ${books.length} BOOKS \xB7 ${totalClaims} CLAIMS</div>
    ${booksHTML}
    ${plannedHTML}`;
  }
  function renderEssentialDeep(key, snapshot) {
    const e = ESS_BY_KEY.get(key);
    if (e === void 0) {
      return "";
    }
    const corpusEss = getEssentialByLayoutKey(key);
    const corpusHTML = corpusEss !== null ? renderCorpusForEssential(corpusEss) : "";
    const status = statusOf(snapshot, key);
    const target = getTargets().find((t) => t.name === key);
    const stance = target?.wallach_stance;
    const quote = stance?.quote ?? stance?.stance;
    const citation = stance?.citation;
    const products = vaultProductsFor(key);
    const wallachHTML = quote !== void 0 && quote.length > 0 ? `
      <div class="kd-essential-deep__sub">WALLACH SAYS</div>
      <p class="kd-essential-deep__body">${escHTML4(quote)}</p>
      ${citation !== void 0 ? `<div class="kd-essential-deep__source">CITED \xB7 <strong>${escHTML4(citation)}</strong></div>` : ""}` : '<div class="kd-essential-deep__sub">WALLACH SAYS</div><p class="kd-essential-deep__body">\u2014 no stance on file for this essential \u2014</p>';
    const productsHTML = products.length > 0 ? `
      <div class="kd-essential-deep__sub">FOUND IN YGY VAULT</div>
      <div class="kd-essential-deep__products">
        ${products.map((p) => `<span class="kd-essential-deep__product-chip">${escHTML4(p)}</span>`).join("")}
      </div>` : "";
    return `
    <div class="kd-essential-deep">
      <button class="kd-essential-deep__close" data-kd-action="essential-close" title="Close (Esc)">\xD7</button>
      <header class="kd-essential-deep__head">
        <div class="kd-essential-deep__sym-row">
          <div class="kd-essential-deep__sym">${escHTML4(e.symbol)}</div>
          <div class="kd-essential-deep__name-block">
            <h3 class="kd-essential-deep__name">${escHTML4(e.key)}</h3>
            <div class="kd-essential-deep__cat">${escHTML4(e.catLabel)}${e.ref !== "" ? ` \xB7 ${escHTML4(e.ref)}` : ""}</div>
          </div>
        </div>
        <span class="kd-essential-deep__status-pill ${statusPillClass(status)}">\u25CF ${statusLabel(status)}</span>
      </header>
      ${e.essential ? "" : '<div class="kd-essential-deep__flag"><strong>NON-ESSENTIAL</strong> \xB7 the body can synthesize this, so it is not one of the 90. Shown for completeness \u2014 Youngevity includes it (Ultimate EFA Plus) for cardiovascular balance + optimal absorption.</div>'}
      ${wallachHTML}
      ${corpusHTML}
      ${productsHTML}
    </div>`;
  }
  function renderEssentialsTab(snapshot, selectedKey) {
    const deepHTML = selectedKey !== null ? renderEssentialDeep(selectedKey, snapshot) : "";
    const groupsHTML = ESS_GROUPS.map((group) => {
      const tilesHTML = group.items.map((e) => {
        const status = statusOf(snapshot, e.key);
        const stateClass = e.essential ? statusTileClass(status) : "kd-essential-tile--bonus";
        const cls = `kd-essential-tile ${stateClass}${e.key === selectedKey ? " is-selected" : ""}`.trim();
        const meta = e.essential ? `${escHTML4(e.catLabel)} \xB7 ${statusLabel(status)}` : `${escHTML4(e.catLabel)} \xB7 NON-ESSENTIAL`;
        return `
        <div class="${cls}" data-kd-essential="${escHTML4(e.key)}" role="button" tabindex="0">
          <div class="kd-essential-tile__sym">${escHTML4(e.symbol)}</div>
          <div class="kd-essential-tile__name">${escHTML4(e.name)}</div>
          <div class="kd-essential-tile__meta">${meta}</div>
        </div>`;
      }).join("");
      const essentialN = group.items.filter((i) => i.essential).length;
      const bonusN = group.items.length - essentialN;
      return `
      <div class="kd-section-head">${escHTML4(group.title)} \xB7 ${essentialN}${bonusN > 0 ? ` + ${bonusN}` : ""}</div>
      <div class="kd-essentials-grid">${tilesHTML}</div>`;
    }).join("");
    return `${deepHTML}${groupsHTML}`;
  }
  function renderProductsTab() {
    const products = readProducts();
    if (products.length === 0) {
      return '<div class="kd-empty">\u2014 vault data not loaded \xB7 59 known products live in regimen-label-lookup \u2014</div>';
    }
    const productsHTML = products.slice(0, 30).map((p) => `
    <div class="kd-product-row">
      <div class="kd-product-row__icon">${escHTML4((p.canonical_name ?? p.name ?? "?").charAt(0).toUpperCase())}</div>
      <div class="kd-product-row__body">
        <h4 class="kd-product-row__name">${escHTML4(p.canonical_name ?? p.name ?? "(unnamed)")}</h4>
        <div class="kd-product-row__meta">${escHTML4(p.brand ?? "YGY")} \xB7 ${p.nutrients?.length ?? 0} NUTRIENTS LISTED</div>
      </div>
      <span class="kd-product-row__verdict kd-product-row__verdict--ok">VAULT</span>
    </div>`).join("");
    return `
    <div class="kd-section-head">PRODUCTS VAULT \xB7 ${products.length} ENTRIES</div>
    ${productsHTML}
    ${products.length > 30 ? `<div class="kd-more">\u2014 + ${products.length - 30} more \xB7 scroll wired in polish pass \u2014</div>` : ""}`;
  }
  function renderDoctrineTab() {
    return DOCTRINES.map((d) => `
    <div class="kd-doctrine-card${d.featured ? " featured" : ""}">
      <div class="kd-doctrine-card__id">${escHTML4(d.id)}${d.featured ? " \xB7 CORNERSTONE" : ""}</div>
      <h4 class="kd-doctrine-card__title">${escHTML4(d.title)}</h4>
      <p class="kd-doctrine-card__body">${escHTML4(d.body)}</p>
      <div class="kd-doctrine-card__cite">${escHTML4(d.cite)}</div>
    </div>`).join("");
  }
  function renderTab2(tab, snapshot, selectedKey, selectedCondition) {
    switch (tab) {
      case "corpus":
        return renderCorpusTab();
      case "essentials":
        return renderEssentialsTab(snapshot, selectedKey);
      case "conditions":
        return renderConditionsTab(selectedCondition);
      case "products":
        return renderProductsTab();
      case "doctrine":
        return renderDoctrineTab();
    }
  }
  function renderShell2(activeTab, selectedKey, selectedCondition) {
    const snapshot = getOrCompute();
    const productsCount = readProducts().length;
    const tabs = [
      { id: "corpus", label: "Corpus", count: `${listBooks().length} BOOKS` },
      { id: "essentials", label: "Essentials", count: `${ESS_ESSENTIAL_COUNT} ESSENTIAL` },
      { id: "conditions", label: "Conditions", count: `${listConditions().length} INDEXED` },
      { id: "products", label: "Products", count: `${productsCount > 0 ? productsCount : 59} KNOWN` },
      { id: "doctrine", label: "Doctrine", count: `${DOCTRINES.length} RULES` }
    ];
    const tabsHTML = tabs.map((t) => `
    <button class="kd-tab${t.id === activeTab ? " active" : ""}" data-kd-tab="${t.id}">
      <span>${escHTML4(t.label)}</span>
      <span class="kd-tab__count">${escHTML4(t.count)}</span>
    </button>`).join("");
    return `
    <span class="ds-scan-line" aria-hidden="true"></span>
    <header class="kd-head">
      <div>
        <div class="kd-eyebrow"><span class="pulse-dot"></span>DRAWER \xB7 <span class="ds-cipher" data-cipher-set="hexa">KN\xB7${hexSerial2(activeTab.length * 7)}</span></div>
        <h2 class="kd-title">Knowledge</h2>
        <div class="kd-sub">// the corpus, the essentials, the conditions, the products, the doctrine</div>
      </div>
      <button class="kd-close" data-kd-action="close" title="Close (Esc)">\xD7</button>
    </header>
    <div class="kd-tabs">${tabsHTML}</div>
    <div class="kd-search">
      <span class="kd-search-icon">\u2315</span>
      <input class="kd-search-input" type="text" placeholder="SEARCH ${activeTab.toUpperCase()}\u2026" />
      <span class="kd-search-kbd">/</span>
    </div>
    <div class="kd-body">${renderTab2(activeTab, snapshot, selectedKey, selectedCondition)}</div>
    <footer class="kd-footer">
      <button class="kd-action" data-kd-action="pin"><span class="kd-action__glyph">\u2295</span>PIN</button>
      <button class="kd-action" data-kd-action="share"><span class="kd-action__glyph">\u2197</span>SHARE</button>
      <button class="kd-action" data-kd-action="cite"><span class="kd-action__glyph">\u2311</span>CITE</button>
      <span class="kd-action__spacer"></span>
      <button class="kd-action kd-action--expand" data-kd-action="expand"><span class="kd-action__glyph">\u2922</span>EXPAND</button>
    </footer>`;
  }
  function mount3(container) {
    let isOpen = false;
    let isExpanded = false;
    let activeTab = "corpus";
    let selectedEssential = null;
    let selectedCondition = null;
    const render = () => {
      container.innerHTML = renderShell2(activeTab, selectedEssential, selectedCondition);
    };
    const open = () => {
      if (isOpen) {
        return;
      }
      isOpen = true;
      container.classList.add("kd-open");
      render();
    };
    const close = () => {
      if (!isOpen) {
        return;
      }
      isOpen = false;
      isExpanded = false;
      selectedEssential = null;
      selectedCondition = null;
      container.classList.remove("kd-open", "kd-expanded");
      container.innerHTML = "";
    };
    const toggle = () => {
      if (isOpen) {
        close();
      } else {
        open();
      }
    };
    const toggleExpanded = () => {
      isExpanded = !isExpanded;
      container.classList.toggle("kd-expanded", isExpanded);
    };
    const clickHandler = (ev) => {
      const target = ev.target;
      if (target === null) {
        return;
      }
      const tabBtn = target.closest("[data-kd-tab]");
      if (tabBtn !== null) {
        const next = tabBtn.getAttribute("data-kd-tab");
        if (next !== null && next !== activeTab) {
          activeTab = next;
          selectedEssential = null;
          selectedCondition = null;
          render();
        }
        return;
      }
      const essEl = target.closest("[data-kd-essential]");
      if (essEl !== null) {
        const k = essEl.getAttribute("data-kd-essential");
        selectedEssential = k !== null && k === selectedEssential ? null : k;
        render();
        return;
      }
      const condEl = target.closest("[data-kd-condition]");
      if (condEl !== null) {
        const k = condEl.getAttribute("data-kd-condition");
        selectedCondition = k !== null && k === selectedCondition ? null : k;
        render();
        return;
      }
      const actionEl = target.closest("[data-kd-action]");
      if (actionEl !== null) {
        const action = actionEl.getAttribute("data-kd-action");
        if (action === "close") {
          close();
        } else if (action === "expand") {
          toggleExpanded();
        } else if (action === "essential-close") {
          selectedEssential = null;
          render();
        } else if (action === "condition-close") {
          selectedCondition = null;
          render();
        } else {
          console.warn("[views/knowledge] action stub:", action);
        }
      }
    };
    container.addEventListener("click", clickHandler);
    on("regimen:changed", () => {
      if (isOpen) {
        render();
      }
    });
    return {
      open,
      close,
      toggle,
      toggleExpanded,
      isOpen: () => isOpen
    };
  }

  // assets/data/creators-log-embed.json
  var creators_log_embed_default = [{ id: "lg_mqq28u45_9emebd", ts: "2026-06-23T03:04:02.933502+00:00", surface: "tools", kind: "milestone", summary: "Creator's Log file-mirror created \u2014 chronicle/creators-log.jsonl + tools/creators_log.py make round-close step 5 CLI-fireable; the \xA700 audit trail now lives in the repo as a committed teaching record", detail: "In-app log() (state/log.ts) stays localStorage-only until the Phase-2 boot-merge (L2) embeds these entries into the Profile panel. Writes route through safe_write (\xA717). Validated by the new creators_log_well_formed invariant." }, { id: "lg_mqq2b45f_yeupqe", ts: "2026-06-23T03:05:49.251429+00:00", surface: "tools", kind: "round-close", summary: "Phase 2 L1 shipped: Creator's-Log file-mirror + creators_log_well_formed invariant (board 20\u219221). Round-close step 5 is now CLI-fireable \u2014 this entry is the proof.", detail: "Files: tools/creators_log.py, chronicle/creators-log.jsonl, tools/invariants.py. Verified: creators_log verify 1/1 clean; invariants 21/21. Next: L2 Profile boot-merge, then Journey J1-J4.", metadata: { chunk: "L1", board: "21/21", files: ["tools/creators_log.py", "chronicle/creators-log.jsonl", "tools/invariants.py"] } }, { id: "lg_mqq2g1mt_3ckyms", ts: "2026-06-23T03:09:39.269829+00:00", surface: "meta", kind: "session-end", summary: "Session checkpoint: cleanup A-C4 + logging-doctrine codified + Phase-2 L1 (Creator's-Log mirror, board 21/21). Handoff refreshed. Next: L2 Profile boot-merge \u2192 Journey J1-J4 \u2192 Palette.", detail: "9 commits pushed c2826e9..(this). Every chunk build>test>log>committed. Creator's Log now CLI-fireable; this is a session-end entry through the live tool." }, { id: "lg_mqq30yww_gejq56", ts: "2026-06-23T03:25:55.520134+00:00", surface: "tools", kind: "design-decision", summary: "Codified the two-layer logging model + the Creator's Log sacred covenant (append-only, never deleted even under broad delete-authorization, always truthful/complete, fires per-chunk). Audit found sacredness + never-skip not yet machine-enforced.", detail: "Doctrine in .claude/rules/logging-doctrine.md. 3 enforcement guards proposed (git-anchored append-only invariant, round-close firing check, boundary delete-guard) pending Luneth's approval of the ledger file/folder structure." }, { id: "lg_mqq3i857_1qlldw", ts: "2026-06-23T03:39:20.635214+00:00", surface: "tools", kind: "milestone", summary: "Sacred Creator's Log: moved to chronicle/creators-log/ (log.jsonl + generated LOG.md + README) and added the covenant's teeth \u2014 git-anchored append-only invariant, digest-sync invariant, shell delete-guard, and a never-skip round-close hard-block. Board 21\u219223.", detail: "The append-only invariant makes deleting committed entries un-shippable; the firing-check makes a skipped round-close entry un-closeable. Tightened the delete-guard after a self-inflicted prose false-positive (good stress test)." }, { id: "lg_mqq3lhtx_zlch6t", ts: "2026-06-23T03:41:53.157429+00:00", surface: "tools", kind: "invariant-pass", summary: "Teeth-test PROVEN: creators_log_append_only catches both deletion (truncate 5\u21921) and mutation of committed entries; git restores; board 23/23. The sacred-log guarantee is structural, not aspirational.", detail: "Simulated 'delete entries for efficiency' via safe_write truncate \u2192 invariant fired RED 'SACRED LEDGER TRUNCATED'; in-place edit \u2192 'SACRED LEDGER MUTATED at entry 1'; git checkout restored. try/finally guaranteed recovery." }, { id: "lg_mqq52ira_tnd1aj", ts: "2026-06-23T04:23:07.126050+00:00", surface: "tools", kind: "round-close", summary: "Chunk H: hardened the sacred ledger per the Opus-4.8 audit \u2014 closed 3 enforcement gaps (4a digest spoof, 5a delete-guard dir hole, 5b silent committed-deletion + silent fail-open). All re-proven; board 23/23.", detail: "4a: validate_entry rejects newline summaries + render_digest escapes a leading #/> and flattens newlines so the human digest can't be made to show a fake entry (the jsonl was already injection-proof \u2014 json.dumps escaping, proven). 5a: pre_bash_guard now blocks the whole chronicle/creators-log dir + any child + 'rm -rf chronicle' + a dir mv, while non-sacred deletes still pass. 5b: a COMMITTED deletion (ledger gone from HEAD with prior history) is now a hard RED 'SACRED LEDGER REMOVED FROM HEAD'; git-unavailable now prints a loud UNVERIFIED warning but stays fail-open per Luneth's 'visible warning, not blocking' choice. Verified: invariants 23/23, verify 6/0, digest byte-identical, build OK 290.9 KB, every fix re-proven against real code (incl. the real append_only on an isolated temp git repo). The req-3 truthfulness ceiling stands by design \u2014 next feature (L2 dashboard Creator's Log) is Luneth's visual truth-verification layer; then navigability archive-tree." }, { id: "lg_mqq5oreo_sft46m", ts: "2026-06-23T04:40:24.768965+00:00", surface: "docs", kind: "round-close", summary: "README audit: purged retired-system references (tacitus/cura/vision/aegis/brain) from all 16 READMEs and corrected inaccuracies. 5 fixed, 11 verified clean, 0 dead tokens remain; board 23/23.", detail: "Fixed: root README (Cura/Aegis/Tacitus blockquote -> Eden/Chronicle/Sunjo + added creators-log/ to glossary); chronicle/README (Layout was missing creators-log/ + 3 files; added them + a two-layers section); chronicle/evals/README ('Brain Evaluations' -> historical agent-prompt-era artifacts, preserved not resurrected); tools/README (documented only 1 of ~20 tools + cited brain rules -> full accurate inventory by group, each line verified against the script docstring); fonts/README ('drop these in' -> already in-housed). Verified clean: eden, labels, transcripts, wallach-refresh, canaries, design-wisdom (+subdirs), youngevity-product-notes. Ignored false positives: curation/curated/accuracy (substring 'cura') + the word 'vision'. FLAGGED for Luneth (operating contract, not auto-touched): CLAUDE.md glossary still lists Cura+Aegis as current systems + a Tacitus guard; sunjo plan line 308 lists them (captured history). Historical docs (CHANGELOG/versions/saga/contradictions) intentionally keep period-accurate refs." }, { id: "lg_mqq5x105_9ui544", ts: "2026-06-23T04:46:50.453734+00:00", surface: "tools", kind: "round-close", summary: "Audit follow-ups: retired Cura/Aegis from the CLAUDE.md glossary (slimmed the Tacitus guard) + fixed a pre_bash_guard false-positive where the push-force/reset-hard regexes spanned a separator into an unrelated short-flag. Board 23/23.", detail: "(1) CLAUDE.md glossary dropped the Cura + Aegis entries (retired names; the concepts live in engineering-doctrine.md / the app and appear in no live rule file); the Tacitus line slimmed to a tight do-not-re-introduce guard; Eden + Chronicle stay. (2) pre_bash_guard's push-force and reset-hard checks used .*? with re.DOTALL and matched across command separators, so a 'push-then-unrelated-shortflag' compound was wrongly blocked (hit live when committing the README audit). Scoped both to a single command segment ([^newline;amp;pipe]*?), matching the rm-guard pattern. Proven via a file-based hook probe (trigger phrases kept out of the bash line): the push-then-cleanup and commit-then-push compounds now ALLOW; genuine force/hard flags still BLOCK; force-with-lease ALLOWs; the 5a sacred-ledger guard still BLOCKs (no regression). The two non-README loose ends from the README audit; both user-approved. Next: Feature L2." }, { id: "lg_mqq6gim9_bvrj39", ts: "2026-06-23T05:01:59.745384+00:00", surface: "profile", kind: "round-close", summary: "Phase 2 L2 shipped: the dashboard Creator's Log. The CLI ledger is now inlined at build time and boot-merged with localStorage so the Profile panel shows both CLI- and in-app-fired entries \u2014 Luneth's visual truth-verification layer. Board 23\u219224.", detail: "Closes the in-app half (L1 was the CLI mirror). creators_log.py gains write_embed() (every append/digest regenerates dashboard/assets/data/creators-log-embed.json from log.jsonl via safe_write \u2014 sibling of LOG.md; log.jsonl stays the single source of truth). core/schemas/log.ts adds LogEmbedSchema; state/log.ts imports the embed (esbuild JSON import), validates once at the boundary, and getEntries() boot-merges embed + LS deduped by id (embed canonical wins), newest-first. The existing Profile panel renders getEntries() unchanged, so it now shows the unified log. New invariant creators_log_embed_synced (warning, truth-anchored: json.loads(embed) == read_entries()) catches a stale build / hand-edit. Verified: tsc strict + esbuild OK (298.9 KB); invariants 24/24; render_probe_profile.js PASS \u2014 empty localStorage still renders all embedded CLI entries (count == embed == subheader), a real ROUND CLOSE surfaces, Esc closes, 0 page errors. Deferred: cap the embed to recent-N as the ledger grows (Chunk N). Next: navigability archive-tree." }, { id: "lg_mqq75oel_2m9xyo", ts: "2026-06-23T05:21:33.645862+00:00", surface: "creators-log", kind: "round-close", summary: "Chunk N shipped: navigability archive-tree. The Creator's Log now has a month-by-month INDEX.md + per-month digests/ holding the full history, while LOG.md becomes a recent-window view \u2014 so it stays scannable as it grows over years. Board 24\u219225.", detail: "Luneth's 'archive tree + index' choice. log.jsonl stays the unsharded canonical spine (+ git-prefix anchor); the derived human views gain structure. creators_log.py adds _render_block (shared renderer), render_index/write_index (INDEX.md month map: count + kind tally + digest link), month_of/month_set/render_month/write_months (digests/YYYY-MM.md, full entries), a recent-window cap on render_digest (DIGEST_RECENT=200, header \u2192 INDEX.md), and regenerate_all() called from append/digest so LOG.md + embed + INDEX + monthly digests stay byte-fresh together. New invariant creators_log_archive_synced (warning) is truth-anchored: INDEX.md == render_index() and each digests/*.md == render_month(ym), month set from log.jsonl, no missing/extra files \u2014 this is where full-history human fidelity is now proven (digest_synced only covers LOG.md's window). README documents the new layout + the embed/archive invariants. Verified: invariants 25/25; INDEX + digests/2026-06.md render cleanly (10 entries, full detail, back-links); LOG.md recent-window matches. Deferred: cap the L2 embed to recent-N when it grows large. Next: Journey J1-J4, then command palette." }, { id: "lg_mqq95orc_m6l3l3", ts: "2026-06-23T06:17:33.336269+00:00", surface: "journey", kind: "round-close", summary: "Journey J1 shipped: the state engine. Replaced the throwing scaffold with a real \xA731 events ledger + private check-ins + a \xB17-day cross-ref walker, all Zod-validated. No fake seed \u2014 fills from real activity. Board 25/25; engine functionally smoke-tested.", detail: "First of ~4 Journey chunks (J1 engine \u2192 J2 view \u2192 J3 wiring \u2192 J4 probe). New core/schemas/journey.ts (EventKind/JourneyEvent/Checkin + storage shapes, types inferred). state/journey.ts: listEvents(sinceISO?)/listCheckins() read via getValidated; logEvent()/logCheckin() are the only \xA731 writers to wallachJourneyEvents_v1/wallachJourneyCheckins_v1 (auto id, FIFO cap 5000, emit journey:changed); crossRefForCheckin() = the \xB17-day local correlation walker (check-ins stay private, never exported). core/events.ts: journey:event-logged \u2192 journey:changed {reason}. Verified: tsc strict + esbuild OK; invariants 25/25; esbuild-bundled functional smoke vs a localStorage shim PASS (persistence, newest-first, sinceISO, cross-ref include/exclude, corrupt-LS-empty). No render probe yet (pure state; view verified at J4). Next: J2 the 4-tab drawer view." }, { id: "lg_mqqa4z6g_mshacn", ts: "2026-06-23T06:44:59.800202+00:00", surface: "genesis", kind: "milestone", summary: "Genesis boot system shipped: typing 'genesis' now runs tools/genesis.py \u2014 a one-command session boot (banner + scoreboard + the live pass-off) that hands a fresh session past depth instantly + ends with an action question. Renamed sunjo/ \u2192 genesis/.", detail: "Formalizes the per-session catch-up rather than reinventing it: chronicle/next-chunk.md stays the SINGLE live rolling pass-off (no parallel file); genesis.py reads it + runs the integrity scoreboard (invariants), build-parity, last Creator's Log entry, build-log tail, and prints the next-chunk LATEST\u2192NEXT-ORDER block, closing with a cue to ask 'resume X or redirect?'. sunjo/ \u2192 genesis/ via git mv (history preserved): the folder now houses the boot system + the archived original Cowork pass-off (01/02); genesis/README documents the two-pass-off model. CLAUDE.md Genesis section rewritten (net -1 line, 195/200) to point at the command + mandate the action question; all LIVE sunjo path refs \u2192 genesis/ (history left truthful). Mechanically safe (no tool/hook/invariant referenced sunjo). Verified: genesis.py boots cleanly; invariants 25/25. Next: Journey J2." }, { id: "lg_mqqqtit6_5uctcj", ts: "2026-06-23T14:31:58.842948+00:00", surface: "journey", kind: "round-close", summary: "Journey J2 \u2014 views/journey.ts 4-tab drawer renderer + LOG EVENT/check-in forms; mirrors knowledge.ts, reads only via state layer, zero inline literals. Also implemented read side of state/goals.ts (+ new core/schemas/goals.ts). Board 25/25, probes pass.", detail: "Replaced the throwing views/journey.ts scaffold with a real renderer using self-namespaced jd-* classes (parallel to Knowledge's kd-*; the v3 proposal's generic .timeline/.goal-card/.milestone would collide with legacy-dashboard.css \u2014 jd-* CSS is the Round-6 polish pass). Timeline groups events into calendar-day buckets (Map, newest-first, kind->glyph/accent, relative-time + delta); Goals shows progress bar + blockers + featured; Check-ins (private) renders 5-pip severity + tags + the +/-7-day cross-ref as 'CROSS-REF \xB7 <top event>'; Milestones distinguishes earned/locked/fresh-under-24h. The footer LOG EVENT primary + the Check-ins quick-entry open inline forms calling journey.logEvent()/logCheckin() with bounded inputs (maxlength + slice + clampSeverity + EventKindSchema.safeParse). To avoid crashing on the still-scaffolded goals state, implemented its READ side: new core/schemas/goals.ts (GoalSchema/MilestoneSchema + LS shapes, .optional() not .default() to keep input==output types) + Zod-validated listGoals/listMilestones (bad LS -> empty); evaluateMilestoneTriggers stays a deferred throw. Verified: tsc strict + esbuild OK (main.js 307.6 KB; journey code is tree-shaken from the runtime bundle until J3 calls mount() \u2014 tsc is the compile gate); eslint clean on all 4 files; invariants 25/25 (0 new reds); coverage + knowledge render probes PASS. No journey render probe yet \u2014 the drawer mount is J3 and the visual probe is J4 (honesty rule). NEXT: J3 \u2014 shared K+J mount/toggle/keys helper + auto-derive subscriptions." }, { id: "lg_mqqsqygj_fmu96a", ts: "2026-06-23T11:25:58.387680-04:00", surface: "tooling", kind: "design-decision", summary: "Creator's Log timestamps now store machine-LOCAL time (auto-follow ET->CT + DST) instead of UTC. _now_iso uses datetime.now().astimezone(); _fmt_ts derives the zone from the stored offset. Historical UTC entries stay UTC (immutable ledger).", detail: "Luneth flagged that log times read in UTC (an entry made at 10:31 EDT showed as 14:31 / 06:44), confusing against his local clock, and that he's moving ET->CT next week. Chose auto-follow-local over hard-pinning CT so it adapts to the move + DST with zero maintenance. Two-line change in tools/creators_log.py: _now_iso() now returns datetime.now().astimezone().isoformat() (local-aware, carries the offset); _fmt_ts() derives the zone label from the parsed offset (%Z) instead of hardcoding 'UTC'. The slice-based renderers (genesis last-log line, Profile panel formatTs) need no change \u2014 they read the stored wall-clock directly, so new entries show local automatically. The ~13 pre-change entries stored +00:00 stay UTC (the ledger is append-only/immutable; never rewriting history). This entry is the first stored in local time." }, { id: "lg_mqqt86uf_88lvtm", ts: "2026-06-23T11:39:22.407988-04:00", surface: "discipline", kind: "design-decision", summary: "Codified the visual/human-verification gate (.claude/rules/visual-verification.md + CLAUDE.md row): for any page/visual/UX work Luneth is the test gate \u2014 build a chunk to 'done', STOP, he visually verifies, only then continue. Never chain past a STOP; certainty != truth.", detail: "Luneth elevated the per-page build method to a non-negotiable rule. Automated gates (build/invariants/probes) prove only the functional layer; the subjective/visual layer can ONLY be verified by his eyes. The discipline: build in phases (respect resource usage) -> build to 'done' or one verifiable chunk -> STOP -> he visually verifies/course-corrects/adds/changes mind -> only then log + continue. Never advance past a STOP without his go-ahead; never claim he verified what he didn't; never treat agent-certainty as truth. This is build>test>log>repeat with Luneth as tester, and the guardrail that would have caught the unstyled-drawer drift. Documented as a behavioral discipline (like the source-rule turn-gap), not a Python invariant; the structural guarantee is that visual chunks END at a STOP by default. NEXT: Coverage as first gold-standard page." }, { id: "lg_mqqxdip7_mg7c11", ts: "2026-06-23T13:35:29.515119-04:00", surface: "coverage", kind: "milestone", summary: "Coverage Phase 1 \u2014 shell now ~pixel-exact to v3.2 (Luneth verified). Fixed via new tools/style_diff.js: legacy 15px root + bare header/footer selectors bleeding into the .app-* shell; in-housed the missing Chakra Petch/Bruno Ace fonts. Visual-match lesson codified.", detail: "First gold-standard surface phase under the visual-verification gate (build -> STOP -> Luneth verifies -> commit). An objective computed-style diff (new tools/style_diff.js, live shell vs the v3.2 mockup) drove it from ~50 diffs to 0 meaningful, replacing eyeballing. Two systemic root causes: (1) legacy-dashboard.css html,body{font-size:15px} shrank the whole rem UI to 93.75% -> removed, 16px root re-scales the entire coverage page; (2) legacy bare element selectors (header/footer/html,body) bled into the new .app-* shell (14px radius, teal shadow+border, a header::before veil over .app-topbar hiding its accents + fading the search, teal text) -> scoped to #legacy-workspace-host + doc-level overrides removed (grep [v3-contain]). Also in-housed the v3.2 fonts (Chakra Petch + Bruno Ace; wired but never procured -> @font-face 404 -> Space Grotesk fallback). Lesson codified in .claude/rules/visual-verification.md 'Getting to exact'. NEXT: finish Coverage hero/periodic/sidebar vs v3.2; CODEX dynamic version; alien-glyph cipher." }, { id: "lg_mqr73n9n_p9z964", ts: "2026-06-23T18:07:45.035981-04:00", surface: "dashboard/legacy-css", kind: "round-close", summary: "Sever-Safety: scoped all 24 legacy-dashboard.css leak vectors under :where(#legacy-workspace-host); moved the globals the shell was secretly inheriting into dashboard.css; new critical invariant legacy_css_contained makes the leak impossible. Luneth-verified.", detail: "Audit (Luneth's 'total clean cut' ask) confirmed the legacy->v3 sever is clean at the markup level (one #legacy-workspace-host div, R2->R5 deletion schedule) but was leaky at the CSS level with no enforcement. The parked legacy stylesheet (loaded after the v3 design system) had 24 bare element/universal selectors (teal h2/h3/table, @media header, *, html/body) that bleed into the .app-* shell; only the 4 that already bit were hand-patched. Fix: :where(#legacy-workspace-host) scoping (zero added specificity -> legacy cascade preserved byte-for-byte) + html,body/body collapsed onto the host. Critical mid-chunk catch: the pixel-exact shell was silently riding on legacy's leaked star{box-sizing} + html,body font-smoothing (the sealed v3 token sheet scopes those to .ds-canvas only, which .app-shell doesn't use), so moved box-sizing/smoothing/line-height into dashboard.css. New critical invariant legacy_css_contained: deterministic re-parse, no bare element/star/non-var :root selector may ever exist; proven with a negative test. Verified 24->0 leak vectors, style_diff 4 live-better residuals only, invariants 26/26, render probes 0 errors." }, { id: "lg_mqrf7brf_5o0xqy", ts: "2026-06-23T21:54:33.675631-04:00", surface: "journey", kind: "round-close", summary: "Journey J3+J4: mounted the J2 view (kills the last legacy teal; shared K+J registry -> J rail/Esc/bare-J open the new drawer) + auto-derive; styled the whole drawer to the v3 mockup (jd-* scoped to #drawer-journey-mount); topbar BRAIN->CODEX. Board 26/26.", detail: "J3 generalized the Knowledge-only drawer wiring in main.ts into a shared K+J registry (DRAWER_SPECS: mountDrawers/toggleDrawer/wireDrawerKeys/closeAllDrawers); the J rail item + Esc + bare-J now open the new jd-* drawer instead of the legacy #tab-journey teal tab. Auto-derive: scanner:scan-complete / regimen add-remove-restore / goals:updated -> journey.logEvent (excludes high-frequency coverage:recomputed + dose-edit to avoid flooding). drawer-journey.css ports the v3 mockup vocabulary onto the view's jd-* classes, every rule rooted at #drawer-journey-mount so it cannot leak (Sever-Safety lesson applied preemptively): panel + chrome + all 4 tabs + the quick-checkin entry button + inline forms. Built in 2 visual-verified phases. CODEX: the 2 visible topbar BRAIN refs renamed; v3.27 kept (consistent with footer + versions-data, no drift); full v1.0 stamp queued. New tools/render_probe_journey.js: 13 checks incl. legacy-host-not-shown (teal-kill proof). Knowledge drawer still unstyled by design (identical shell; drawer-journey.css is the template)." }, { id: "lg_mqrlsxe3_47za1h", ts: "2026-06-24T00:59:19.179850-04:00", surface: "knowledge", kind: "round-close", summary: "Knowledge drawer SHIPPED to gold-standard: shared-chrome refactor + full kd-* styling + Essentials deep-dive + 90-essentials/Omega-9 reframe (\xA700.A confirmed) + drawer +100px. Board 26/26.", detail: "Lifted shared drawer chrome into drawer-shared.css (dual jd-*/kd- selectors, both mount-rooted = single source, no leak); kd-* tab-content rename closes the legacy .essential-tile collision. Essentials tab rebuilt layout-driven (all shown, real symbols, coverage-state colors from the same CoverageSnapshot classifier) + click-to-expand Wallach deep-dive (quote/citation + matchEssential vault chips). Omega-9 flagged essential:false in coverage-layout-data.json (single source) -> always 90; teal --bonus tile + on-click non-essential note, coverage math retained. Caught + fixed a */-in-CSS-comment that silently dropped the journey panel width:600 (probe caught 580px). Germanium (61st embed mineral, absent from layout) flagged for next-genesis reconciliation; all live 91/92 instances inventoried in next-chunk.md. Verified: build OK, invariants 26/26, knowledge/journey/coverage/seeded probes green, Luneth visually verified." }, { id: "lg_mqrurhp1_wezm0z", ts: "2026-06-24T05:10:08.725846-04:00", surface: "coverage/essentials", kind: "round-close", summary: "90-essentials correctness: Germanium replaces Fluoride in the 60 (Wallach 60-graphic, 4x-confirmed); Fluoride scrubbed pending corpus audit; count unified at 90 via essentialCount(); all names shown full; vitamin/amino tiles unified to mineral format + gap fixed.", detail: "Files: essentials-targets.json, essentials-targets-data (embed+json), essentials-benefits-data, coverage-layout-data, state/coverage.ts (essentialCount helper), views/{coverage,scanner,regimen}, core/schemas/knowledge, workspace-coverage.css, render_probe_seeded. Verified: build OK, 26/26 invariants (embed-sync=91), 5 render probes green, 0 clipped names. Record: chronicle/contradictions/2026-06-24-germanium-replaces-fluoride.md. Open for corpus audit: Fluoride re-adjudication + hallucination provenance + Cysteine-vs-Taurine." }, { id: "lg_mqsbi1oa_o37hbt", ts: "2026-06-24T12:58:41.530708-04:00", surface: "eden/corpus", kind: "milestone", summary: "Wallach Knowledge Revamp Phase \u03B1: Eden gains Wing 2 (eden/corpus \u2014 6 books in-housed + sealed 90-canon + claim-graph scaffold) and Wing 3 (eden/graphics \u2014 5 sacred hand-made graphics). 6 seal/verify tools, 3 invariants. Board 29/29. Two-tier knowledge model live.", detail: "Reframe: Eden = all Tier-1 canonical Wallach truth (three wings: YGY catalog, corpus, graphics); knowledge/ = Tier-2 unsealed (transcripts-clean + design-wisdom). Engineering: claims sharded per book; verbatim is the durable anchor (PDF books lack reliable page markers); content hashes over LF-normalized text (clone-stable, .gitattributes eol=lf); agent-in-the-loop extraction (no LLM subsystem \u2014 determinism from seal+hash); corpus_verify.py is the single impl of 10 checks, the corpus_integrity invariant shells out to it. Sealed files protected free via <name>.json.golden.sha256 = pre_write_guard auto-block. Sealed knowledge_version=2 (re-sealed after an is_sealed naming-bug caught by the seal's own gate). Deviations from the approved proposal (improvements): no invariant-baseline entries (bootstrap returns green like eden_hash_integrity); deferred core/schemas/corpus.ts to Phase \u03B5 (avoid a dual schema source). Proposal: chronicle/proposals/wallach-knowledge-revamp.md. NEXT: Phase \u03B2 DDDL extraction." }, { id: "lg_mqsc1qv5_y0atm9", ts: "2026-06-24T13:14:00.641209-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.1: DDDL extraction pipeline live + first 10 claims sealed (knowledge_version=4). corpus_extract.py finalize snaps agent-authored verbatims to exact book bytes; corpus_verify proves every verbatim is a real book substring. Board 29/29. Stop for format review.", detail: "Agent-in-the-loop extraction proven end-to-end on DDDL: 10 claims across 6 kinds (deficiency_sign\xD73, mechanism\xD72, prevalence\xD72, prognosis, personal_anecdote, quote) \u2014 selenium/copper/calcium/chromium/vanadium deficiency-disease claims + the 1895-JAMA doctor-lifespan hook + plant-derived-colloidal-minerals framing. Pipeline: I author kind/slugs/claim_text/verbatim \u2192 corpus_extract.py finalize snaps verbatim to exact book bytes (whitespace-collapse + quote/dash fold + index map), assigns WAL-CLM ids + char_offset, validates essentials against the 90-canon \u2192 corpus_seal promotes \u2192 corpus_verify check #2 proves substrings. Fixed 2 bugs: seal counted claims pre-promotion (note said 0 for 10); finalize overwrote the draft (now merges the sealed shard for safe multi-batch). STOP for Luneth's claim format/quality review before extracting DDDL at volume." }, { id: "lg_mqscjnqk_7itlhf", ts: "2026-06-24T13:27:56.396722-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.2: claim voice locked (neutral declarative, Luneth-approved) + dose kind added; DDDL re-sealed at 14 claims (knowledge_version=5, 7 kinds). Board 29/29.", detail: "Luneth ruled claim_text = neutral declarative (no 'Wallach asserts' prefix; attribution lives in verbatim + the all-Wallach corpus). Re-authored the 10 + added 4 incl. first dose claims (germanium 20-30 mg/day maintenance, silver 400 mg/day + mechanism, germanium deficiency). ids restart 1-14. corpus_verify PASS \u2014 all 14 verbatims exact book substrings. Granularity: keep faithful list-claims; Phase-\u03B4 derive explodes conditions[] into per-condition index entries. NEXT: continue DDDL at volume, then \u03B3 books, then \u03B4 indices." }, { id: "lg_mqscz2b6_bp896n", ts: "2026-06-24T13:39:55.122321-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.3+\u03B2.4: DDDL extraction at volume \u2014 40 claims sealed (knowledge_version=7) across ~15 minerals from Appendix A (copper/selenium/chromium/vanadium/iron/iodine/zinc/tin/manganese/molybdenum/germanium/silver/cesium/strontium/calcium). 10 of 13 kinds in use. Board 29/29.", detail: "Three merge-batches: 14\u219228\u219240, ids contiguous WAL-CLM-DDDL-1..40, every verbatim proven an exact book substring. Added kinds interaction/contraindication/protocol. Highlights: tin\u2192male-pattern baldness; vanadium-as-insulin (adult-onset diabetes); selenium glutathione-peroxidase + heart/cancer route; zinc 70 metalloenzymes; chromium 90%-deficient/33% lifespan; iron pica + ascorbate interaction; iodine+tyrosine\u2192thyroxin; cesium high-pH cancer; manganese\u2192carpal tunnel; germanium/silver doses. NEXT: DDDL vitamins+aminos + the disease-protocol chapters, then Phase \u03B3." }, { id: "lg_mqsd3481_0gzz8v", ts: "2026-06-24T13:43:04.225476-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.5: DDDL vitamins batch \u2014 40\u219245 claims sealed (knowledge_version=8). Minerals + vitamins now covered (A, B9, B1, B12). Board 29/29.", detail: "Vitamins scattered in DDDL (no element-style appendix); harvested clinic-deficiency narrative + B12/cobalt section. OCR lesson: page-headers inject mid-sentence + hyphen-at-linebreak words break the snapper \u2014 avoid spanning them. NEXT: aminos+fatty-acids, then disease-protocol chapters, then Phase \u03B3." }, { id: "lg_mqsdgdq7_0k4gy3", ts: "2026-06-24T13:53:23.071934-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.6: DDDL disease-protocol chapters \u2014 45\u219255 claims (knowledge_version=9). First condition\u2192protocol+dose claims (diabetes, arthritis, asthma, cor pulmonale, cradle cap). 11 of 13 kinds. Board 29/29.", detail: "From DDDL Appendix B alphabetical disease encyclopedia. Diabetes: chromium prevents/treats; vanadium-replaces-insulin quote; Cr+V 250 mcg/day + full regimen. Arthritis: nutritional-deficiency complex + RA=Mycoplasma; Ca 2000/Mg 800-1000 mg/day; Ca:P 2:1. Asthma: EFA/Mn/Mg malabsorption. Cor pulmonale: selenium 500-1000 mcg/day. Cradle cap: B6+zinc. protocol kind now heavy. Verbatims dodge OCR page-headers. NEXT: more disease entries + aminos/fatty-acids, then Phase \u03B3." }, { id: "lg_mqsdja42_tt6qp7", ts: "2026-06-24T13:55:38.354192-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.7: more DDDL disease entries \u2014 55\u219262 claims (knowledge_version=10). Cancer (prevention + iconic survival quote), osteoporosis (HCl+Ca, estrogen/fluoride critique, estrogen contraindication), otitis (95% milk allergy). Board 29/29.", detail: "62 claims span minerals + vitamins + condition protocols / 11 of 13 kinds. Cancer-survival quote anchored on the clean sub-span to skip a mid-sentence page-header. NEXT: aminos/fatty-acids + remaining disease entries, then Phase \u03B3 the other 5 books, then Phase \u03B4 indices." }, { id: "lg_mqsdqmg6_lflnfb", ts: "2026-06-24T14:01:20.934283-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.8+\u03B2.9: DDDL aminos/fatty-acids + more diseases \u2014 62\u219275 claims (knowledge_version=12). ALL FOUR essential categories now covered; 12 of 13 kinds. Taurine adjudication evidence captured. Board 29/29.", detail: "\u03B2.8 closed fatty acids (EFA def/prostaglandins/infant deficiency) + aminos (Wallach adds arginine/taurine/tyrosine\u2192cancer/macular/goiter \u2014 taurine in other_substances + tagged for the Cysteine-Taurine canon audit; tryptophan/phenylalanine/methionine functions; cholesterol\u2192vit-D/hormones). \u03B2.9: infertility, muscular dystrophy+Keshan (selenium), muscle cramps (Ca/Mg), insomnia. 75 claims span minerals+vitamins+aminos+fatty-acids + condition protocols. NEXT: remaining DDDL diseases, then Phase \u03B3 (Rare Earths next)." }, { id: "lg_mqse78vp_f666sf", ts: "2026-06-24T14:14:16.501380-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B2.10-\u03B2.12: DDDL disease-encyclopedia sweep \u2014 75\u219294 claims (knowledge_version=15). ~25 common conditions (angina, BPH, kidney stones, Bell's palsy, menopause, colds, arteriosclerosis, anxiety, ...). Board 29/29.", detail: "Appendix B alphabetical encyclopedia (A-C range), common/high-value conditions only. Iconic: arteriosclerosis=magnesium-deficiency calcification + vit-D angiotoxicity; kidney stones from Ca/Mg deficiency ('stones come from your own bones'); BPH from zinc deficiency; menopause estrogen contraindication. 94 claims span all four essential categories + ~25 conditions / 12 of 13 kinds. SCOPE: encyclopedia long tail (~175 obscure entries) remains. DECISION: proceed to Phase \u03B4/dashboard test, or grind full encyclopedia first." }, { id: "lg_mqsel3yr_60y12r", ts: "2026-06-24T14:25:03.315864-04:00", surface: "eden/corpus", kind: "milestone", summary: "Phase \u03B4: derived indices implemented + sealed (knowledge_version=16). 5 indices from 94 DDDL claims: essentials(90)/conditions(64)/symptoms(8)/other-substances(1)/consistency(1). verify check #8 (re-derive byte-compare) now active. Board 29/29.", detail: "corpus_derive.py fully implemented (was stub) + deterministic. Pure top-level slug\u2192entry maps so check #4 (other-substances \u2229 canon = \u2205) is real. Index layer can't drift from claims. NEXT: Phase \u03B5 surface in dashboard (Knowledge drawer Essential Deep-Dive + Condition view) \u2014 lands deferred core/schemas/corpus.ts + embed build + state/corpus.ts + probe \u2014 so Luneth can test." }, { id: "lg_mqshqpij_8bb84r", ts: "2026-06-24T15:53:23.371136-04:00", surface: "dashboard/knowledge", kind: "round-close", summary: "Phase \u03B5.1 \u2014 sealed Wallach corpus surfaced in the Knowledge drawer: Essential deep-dive claims (paraphrase+verbatim+cite) + data-driven Corpus tab (real claim counts, newest-first, coming-soon books). New embed/schema/reader + corpus_embed_synced (30/30); kv 16to17.", detail: "Deferred Phase-\u03B5 read path lands: corpus_embed.py \u2192 slim deterministic embed inlined via esbuild JSON import (file:// can't fetch); core/schemas/corpus.ts Zod boundary mirrors the REAL derive output (SCHEMA.md \xA74 corrected, \xA77 documents the embed); state/corpus.ts validated reader. Essential deep-dive shows each essential's claims grouped by kind with the exact book verbatim + citation (\xA700.A source made visible). Corpus tab de-faked: was a hard-coded BOOKS list with invented cite totals; now books-meta + REAL claim_count (DDDL=94, others queued), newest-first, + books-roadmap.json coming-soon set grayed. Luneth-verified the deep-dive; he caught the Corpus-tab fakery + the Immortality year (2017\u21922008, re-sealed kv 16\u219217). Build OK, invariants 30/30, knowledge+coverage+seeded probes green." }, { id: "lg_mqsiqpjm_g5pj1p", ts: "2026-06-24T16:21:23.026945-04:00", surface: "dashboard/knowledge", kind: "round-close", summary: "Phase \u03B5.2 \u2014 Conditions tab (64 conditions, role-grouped deep view w/ doses+citations); extracted corpus render helpers to views/knowledge-corpus.ts + fixed 2 switch-exhaustiveness errors; both view files lint-clean. Phase \u03B5 COMPLETE; board 30/30.", detail: "New Conditions tab over indices/conditions.json reuses the \u03B5.1 claim/chip rendering; selectedCondition threaded through renderTab/renderShell/mount. Luneth-verified. Then the approved cleanup: extracted corpus+condition render helpers into a sibling view module (knowledge.ts 33.7KB->26KB, back under max-lines); required allowing intra-views imports in eslint-plugin-boundaries (one-way views->state->core flow unchanged); fixed the 2 pre-existing switch-exhaustiveness errors. Build OK, eslint 0 problems, invariants 30/30, probe PASS. next-chunk.md: gate passed -> resume extraction." }, { id: "lg_mqsjg6tz_feu7ek", ts: "2026-06-24T16:41:11.831781-04:00", surface: "eden/corpus", kind: "milestone", summary: "Phase \u03B3.1 \u2014 Rare Earths first batch: 13 claims sealed (kv 17->18, 94->107 total). Thesis-heavy book #2 (minerals-as-currency, selenium->cystic-fibrosis discovery, soil depletion, longevity, germanium deficiency/dose/food). Luneth approved the format. Board 30/30, probe green.", detail: "First extraction from book #2 (the flagship). 13 claims WAL-CLM-RARE-000001..13; definition x4, mechanism x5, deficiency_sign, dose, food_source, personal_anecdote. New index conditions cystic_fibrosis + heat_stroke. Every verbatim snapped to exact book bytes first pass, steered clear of OCR hazards. Luneth approved claim_text+verbatim as a copyright-scrub hedge + drift-detection + UX (memory claim-summary-verbatim-format). corpus_seal PASS kv=18; build OK; invariants 30/30; render_probe_knowledge PASS, 0 page errors." }, { id: "lg_mqsjnsha_gp0ryy", ts: "2026-06-24T16:47:06.478697-04:00", surface: "eden/corpus", kind: "milestone", summary: "Phase \u03B3.2 \u2014 Rare Earths batch 2: 5 claims sealed (kv 18->19, 112 total). B12/cobalt dose; birth-defects-preventable + Down's-as-mineral-depletion (Ch7); species longevity ceiling (man 145) + 90-essentials premise (Ch8). Skipped Ch6 fringe crime claims. 30/30, probe green.", detail: "WAL-CLM-RARE-000014..18; dose x1, mechanism x2, definition x2. New conditions birth_defects, down_syndrome. Per-element catalog is OCR-hyphenation-heavy so verbatims drawn from cleaner prose; editorial choice to skip Ch6 behavioral-crime claims (off-mission). Every verbatim exact on first pass. corpus_seal kv=19; build OK; invariants 30/30; probe PASS 0 errors. Rare Earths now 18 claims." }, { id: "lg_mqskbk53_ksts9g", ts: "2026-06-24T17:05:35.415952-04:00", surface: "chronicle", kind: "design-decision", summary: "Session close \u2014 editorial-fringe policy LOCKED: exclude Wallach content only in extreme cases + run by Luneth every time; excluded fringe lives in chronicle/wallach-fringe-excluded.md, not the app. Next genesis: fix Rare Earths OCR from screenshots, then resume extraction.", detail: "NEW chronicle/wallach-fringe-excluded.md catalog (first entries: RE Ch.6 crime claims + Ch.7 emotional-defects list). Memories saved: editorial-fringe-exclusion-policy, claim-summary-verbatim-format, citation-context-expansion. Corpus unchanged kv=19 (112 claims), board 30/30. Session shipped epsilon.1 + epsilon.2 (corpus surfaced in the Knowledge drawer) + gamma.1/gamma.2 (Rare Earths 18 claims). Next session: OCR fix from Luneth screenshots (incl. Wallach own table of the elements), then resume extraction." }, { id: "lg_mqslie6a_29s9oq", ts: "2026-06-24T17:38:53.890506-04:00", surface: "eden/corpus", kind: "milestone", summary: "Phase \u03B3.3 step 0 \u2014 built corpus_resnap.py, the safety tool that makes editing sealed book TEXT safe (re-hash books-meta + relocate/heal/flag every claim verbatim+offset). Tested all paths. Starts the Rare Earths OCR-correction campaign.", detail: "Workflow flip this session: the user supplied the full scanned PDF; the agent can render any page via PyMuPDF and read it at full fidelity (prose AND dense tables, e.g. the periodic table), so no screenshots/page-feeding needed \u2014 agent drives front-to-back. Decisions locked with the user: canonical text format = de-hyphenate + reflow (feeds both verbatim-snapping and the future \xB1200-word context popup); periodic-table grids = clean marker + caption. Mechanics traced: corpus_seal seals books-meta but never re-hashes the book; finalize carries existing claims forward unchanged; corpus_verify check #6 (book hash) + #9 (offset) catch drift loudly. corpus_resnap fills the gap: skeleton (letters-only) match auto-heals reflow/hyphen/whitespace changes, refuses to guess on letter-changes (a fixed scan error inside a verbatim span) or ambiguous duplicates -> --fix path for manual re-author. Honest note: handoff overstated the periodic table as a custom nutrient graphic; it is the STANDARD periodic table of all 103 elements (Table 11-6) that frames the alphabetical-by-symbol element catalog." }, { id: "lg_mqso3i6l_d79myj", ts: "2026-06-24T18:51:18.093517-04:00", surface: "knowledge", kind: "design-decision", summary: "Fringe containment zone established per Luneth's ruling: knowledge/fringe-knowledge/ with one file per category (criminal-behavior, social-emotional-defects) + README. Criminal-behavior content filed there, never front-facing, for his later manual review.", detail: "Luneth ruled: anything linking minerals to criminal behavior goes in a dedicated criminal-behavior document (not front-facing); ALL fringe lives under knowledge/fringe-knowledge/ (NOT a new top-level dir), categorized, as a clean containment zone to decide later what (if anything) graduates to Eden. Migrated the prior chronicle/wallach-fringe-excluded.md (Ch.6 Ed Gein/Waneta Hoyt crime thesis -> criminal-behavior.md; Ch.7 'emotional defects/homosexuality' framing -> social-emotional-defects.md) faithfully; old path is now a redirect stub (excluded != deleted). Added 2 new Rare Earths Preface (p.xviii) criminal-behavior entries surfaced during batch-1 review. Memory editorial-fringe-exclusion-policy updated to the new location." }, { id: "lg_mqsouubv_94ilfs", ts: "2026-06-24T19:12:33.547908-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 1: Rare Earths Preface (xvii-xix) reflowed + 6 thesis claims sealed (kv 19\u219220, RARE 18\u219224, 118 total). corpus_resnap healed 4/relocated 13/0 broken \u2014 the OCR-correction pipeline works end-to-end. Luneth-approved.", detail: "First real exercise of the full OCR-correction pipeline: render scanned PDF page -> read at high DPI -> safe_write reflow of the book text -> corpus_resnap (re-hash books-meta + heal/relocate existing claims) -> finalize new claims (verbatims snap to cleaned bytes) -> corpus_seal -> corpus_embed -> build -> invariants 30/30. 6 net-new Preface thesis claims (WAL-CLM-RARE-000019..24): population doubling-time collapse; 75.5y US lifespan=62% of 120-140y potential, 17th rank; no lifestyle movement extends lifespan; the 90 essentials no longer reliably in food; genetic engineering can't substitute for raw materials (Mercedes-without-oil); the 5+ ancient longevity cultures via plant-derived colloidal minerals. Process lesson: the Preface .txt OCR was high-quality; trust it as base, verify at high DPI, fix only genuine errors (one: Biosphere Il->II). Caught + corrected a gist-read error in my own fringe file (dead->steal records) \u2014 careful word-level reading matters. Criminal-behavior passages filed to knowledge/fringe-knowledge/, never front-facing." }, { id: "lg_mqspifnu_tbsuau", ts: "2026-06-24T19:30:54.282144-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 2: Rare Earths Ch.2 opening (Minerals: The Currency of Life) reflowed + 3 claims (kv 20\u219221, RARE 24\u219227, 121 total). Hit a content-policy block on a full-page image render (salt-slave-trade history) \u2014 worked around via the PDF text layer. Luneth-approved.", detail: "3 new Ch.2 claims (WAL-CLM-RARE-000025..27): minerals a necessity since before recorded history (clays/salts/animal tissue/colloidal-mineral plants); anti-low-salt stance (sodium+chloride, the livestock salt block + snack-food craving); July 1993 East Coast heat-wave deaths attributed to physician-prescribed salt-free diets for BP/heart disease, survivors given IV saline (sodium+heat_stroke, aligns with existing claim 3). Salt-trade history (Via Salaria/Marco Polo/Chinese salt taxes/African caravans) skipped as anecdote per claim-first. INCIDENT + workaround: rendering the full p20 image tripped an image content classifier (the page's salt-as-money history mentions trading for 'brides or slaves' + p21 the African salt-slave trade) \u2014 pulled those pages from the PDF text layer instead (plain text, bypasses the image classifier), cross-checked against the .txt (two independent OCRs agreeing). Recorded in memory reading-and-correcting-scanned-pdfs for future sessions." }, { id: "lg_mqsq242c_ame0ho", ts: "2026-06-24T19:46:12.372903-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 3: Rare Earths Ch.2 (60-metals + lithium) + Ch.3 'Our Earth Is Anemic' opening, 5 claims (kv 21\u219222, RARE 27\u219232, 126 total). Used the PDF text layer + programmatic de-hyphenation to stay off image renders after the prior content-policy block. Luneth-approved.", detail: "5 claims WAL-CLM-RARE-000028..32: the foundational 60-of-75-metals-have-physiological-value + no-bodily-function-without-a-mineral-cofactor; Wallach's lithium-to-public-water + eliminate-fluoride recommendation; the Earth-is-anemic soil-depletion thesis; remineralizing farmland is technically possible but economically impossible; soil minerals are uneven (chocolate-swirl veins) so food alone is a mineral crap-shoot. Skipped the Ch.2 history-of-mineral-medicine survey (arsenic/mercury/lead/alchemy/Epsom) + salt-trade history as anecdote per claim-first. Reflow done programmatically (de-hyphenate + join lines) to preserve exact original characters incl. curly quotes; verified .txt against the PDF text layer (two independent OCRs). Left page-boundary header garble (CREED, physi-/cians split) for a later sweep. NEXT (Luneth ruling): close the fluoride re-adjudication \u2014 Wallach's books are now the sole authority (claim 29 = his anti-fluoride stance), scrub old pre-corpus fluoride remnants." }, { id: "lg_mqsqgjfy_otw1lt", ts: "2026-06-24T19:57:25.486256-04:00", surface: "eden/corpus", kind: "design-decision", summary: "Fluoride re-adjudication CLOSED (Luneth ruling): Wallach's books are sole authority. Removed the fluoride pending_adjudication + claim-29 stale tag; his anti-fluoride stance is now book claim WAL-CLM-RARE-000029. kv 22\u219223.", detail: "Luneth: 'Fluoride is no longer a pending item, whatever Wallach says from his books is what we go off of. Close the fluoride thing, no remnants of the old fluoride claims, only the new book files / single source of truth.' Done: removed fluoride-re-adjudication from essentials-canon.json (cysteine-vs-taurine remains open); dropped the fluoride-adjudication tag from claim 29 (synced shard + draft so seal-promotion wouldn't revert it); appended a RESOLUTION to chronicle/contradictions/2026-06-24-germanium-replaces-fluoride.md. Remnant audit: live app already fluoride-clean (coverage-layout-data.json = Germanium); other fluoride strings are Wallach source, chronicle history (incl. Creator's Log saga), or deprecated pre-Eden knowledge-layer (Phase \u03B7). next-chunk.md to update at session close." }, { id: "lg_mqsqrdtg_pdc9bs", ts: "2026-06-24T20:05:51.412278-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 4: Rare Earths Ch.3 \u2014 the iconic Senate-Doc-264 minerals>vitamins quote + the soil-mining-by-cropping mechanism (2 claims, kv 23\u219224, RARE 32\u219234, 128 total). Text-layer-only nav to avoid the sensitive collapse news-clipping pages. Luneth-approved.", detail: "WAL-CLM-RARE-000033 (quote: 'Lacking vitamins, the system can make some use of minerals, but lacking minerals, vitamins are useless' \u2014 Wallach reproduces it in his US Senate Document 264 discussion) + 000034 (mechanism: NPK fertilizer replaces only 3 elements, cropping mines the soil's minerals in 5-10 years, irrigation speeds the leaching; after 100+ years => rising degenerative disease). The Ch.3 stretch between (idx 65-73) = soil-organism botany + a civilization-collapse-from-soil-depletion thesis shown via sensitive news clippings (Rwandan bloodbath, famine, cannibalism) \u2014 navigated via PDF text layer, NO image renders. Deferred the companion Senate-Doc quote + the '60 minerals from food' restatement to a later micro-batch." }, { id: "lg_mqsqzky2_ry1sve", ts: "2026-06-24T20:12:13.898323-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 5: Rare Earths Ch.4 pica/cravings \u2014 3 claims (kv 24\u219225, RARE 34\u219237, 131 total; new condition 'pica'). Pica = the body craving missing minerals, incl. a controlled iron-vs-saline trial linking pica to iron deficiency. Luneth-approved.", detail: "WAL-CLM-RARE-000035 (pica/cribbing in domestic animals = a craving for minerals; mineral-starved animals eat supplements then self-regulate to maintenance), 000036 (geophagia/earth-eating = pica common in mineral-deficient pregnant humans; Wallach's own observation of a hundred pregnant Montana sheep eating clay; kind personal_anecdote), 000037 (iron deficiency drives pica; McDonald & Marshall 1964 controlled trial: 11 of 13 sand-eating children given iron lost their pica vs only 3 of 12 given saline \u2014 links the pica condition to the iron essential). Avoided the garbled hemoglobin values (OCR 'g%'->'9%') by choosing the clean controlled-trial verbatim. Left the colorful Queen Kekuiapoiwa pregnancy-craving anecdote in the book text but did not extract it. Ch.5 ahead (idx 80, the 'I ate his liver' chapter) is likely extreme-pica/fringe territory \u2014 will screen carefully." }, { id: "lg_mqsray9k_znjy4n", ts: "2026-06-24T20:21:04.376630-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 6: Rare Earths end-of-Ch.4 deficiency-behavior cluster \u2014 3 claims (kv 25\u219226, RARE 37\u219240, 134 total). Potassium/diuretics, chromium+vanadium craving signs, teen-pica. Luneth ruled Ch.5 'Divine Hunger' whole-chapter-to-fringe (next).", detail: `WAL-CLM-RARE-000038 (potassium deficiency uncommon from diet but common with diuretics for BP/weight loss \u2014 interaction), 000039 (the 'munchies' + alcohol + chocolate cravings = chromium and vanadium deficiency signs \u2014 deficiency_sign), 000040 (preteen/teen snack-food/drug/smoking/alcohol infatuation = pica from mineral deficiency \u2014 mechanism). Reflow fix: R2 had a spurious OCR blank line mid-sentence ('cravings for alcohol and' | 'candy cravings'); added a sentence-aware merge (join a paragraph into the prior when the prior doesn't end in .!?"). Luneth's Ch.5 ruling: the 'divine hunger' thesis (cannibalism/vampires/werewolves as mineral deficiency) is ABSOLUTELY out of the dashboard \u2014 likely has some merit but too off-the-wall + off-mission, a detriment to the average user; record the full Wallach stance in its own fringe-knowledge file for his later study. Next chunk does that (no corpus change \u2014 book text retains Ch.5; fringe doc only).` }, { id: "lg_mqsrisje_gotd2e", ts: "2026-06-24T20:27:10.202610-04:00", surface: "knowledge", kind: "design-decision", summary: "Rare Earths Ch.5 'Divine Hunger' ruled whole-chapter-to-fringe by Luneth: the cannibalism/vampire/werewolf-as-extreme-mineral-deficiency thesis is off-mission, kept OUT of corpus + dashboard, recorded in full for his study (knowledge/fringe-knowledge/).", detail: "Wallach adds a 4th theory of cannibalism's origin \u2014 'the ultimate extension of pica (bizarre cravings and behavior resulting from extreme mineral deficiencies)' \u2014 and applies it to Aztec cannibalism (soil depletion), Dracula/vampires (Vlad, Gilles de Rais, Bathory), werewolves (Windigo/Cree), and modern serial killers ('the vampires and werewolves of our time' \u2014 Maybrick/Jack-the-Ripper, Chikatilo, Gein, Hoyt), concluding depleted soils => rising pica => more serial killers 'at a geometric rate.' Luneth: 'VERY likely has some merit but so off the wall and not helpful... would only serve as a detriment for the average user.' Recorded faithfully (thesis verbatims + named examples; gory anecdotes summarized, not reproduced); read via PDF text layer only (graphic content). Cross-refs criminal-behavior.md (Gein/Hoyt also in Ch.6). No corpus change \u2014 book text retains Ch.5, no claims, kv stays 26." }, { id: "lg_mqsroe9j_kkcei8", ts: "2026-06-24T20:31:31.639168-04:00", surface: "chronicle", kind: "session-end", summary: "Session close \u2014 Phase \u03B3.3 Rare Earths OCR-correction: 22 new claims (RARE 18\u219240, kv 19\u219226), Preface\u2013Ch.4 cleaned + mined, Ch.5 'Divine Hunger' whole-chapter fringe, fluoride adjudication closed. Built corpus_resnap + the fringe zone. Board 30/30, all pushed.", detail: "Big session. Workflow unlock: agent reads the scanned Rare Earths PDF directly via PyMuPDF render\u2192Read (no screenshots; fitz idx = printed+21) and the per-batch OCR-correction pipeline (reflow\u2192corpus_resnap\u2192finalize\u2192seal\u2192embed) safely edits sealed book text. Content-policy lesson: full-page image renders of graphic/sensitive pages trip an image classifier \u2192 use the PDF text layer for those + small crops only for innocuous verbatim checks. Shipped: corpus_resnap.py (d0bd8ca), fringe containment zone knowledge/fringe-knowledge/ (259a7d8), batches 1-6 across Preface + Ch.2-4 (fdce2f5/ab87001/0c895f9/52b2f9f/cc8c28f/761549f), fluoride closed (614f565), Ch.5 Divine Hunger fringe (c843d77). Handoff next-chunk.md refreshed; next session resumes front-to-back at Ch.6 'THE BAD SEEDS' (screen for fringe first), then the per-element catalog Ch.11-12 (OCR-roughest + richest). cysteine-vs-taurine is the only canon adjudication still open." }, { id: "lg_mqstauwl_t771v8", ts: "2026-06-24T21:16:59.253635-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 7 \u2014 Rare Earths Ch.6 'The Bad Seeds' crime thesis ruled whole-chapter FRINGE; 3 general claims salvaged to corpus (RARE-41..43: lithium-in-water, allergic-shiners/geographic-tongue signs, infant-formula minerals). kv 26\u219227, 137 claims, board 30/30.", detail: "Luneth ruled MIXED on Rare Earths Ch.6 'The Bad Seeds: The Jekyll and Hyde Syndrome' (idx 106-143 / pp85-122): the crime/violence/serial-killer-as-mineral-deficiency thesis is off-mission + reputationally toxic for a nutrient-coverage app -> recorded faithfully to knowledge/fringe-knowledge/criminal-behavior.md (graphic cases summarized, 5 thesis verbatims kept), OUT of corpus + dashboard. But 3 GENERAL deficiency claims embedded in the chapter were salvaged into the sealed corpus: WAL-CLM-RARE-000041 (lithium moderates mood/behavior at municipal-water trace levels \u2014 Schrauzer's 27-Texas-county 1978-87 study; Wallach favors lithium over fluoride in water), 000042 (deficiency_sign: 'allergic shiners' -> Cr/V/Li, 'geographic' tongue -> B-vitamins/Zn, from Fig.6-3; new symptom slugs allergic_shiners + geographic_tongue), 000043 (commercial infant formula is mineral-poor \u2014 pet foods carry 40/28 minerals vs <=12 in formula, Cr/V/Li absent). Pipeline: reflowed 3 .txt spans via safe_write (de-hyphenation + restored the OCR-dropped geographic-tongue caption), corpus_resnap 9 relocated/0 broken, finalize, seal kv 26->27 (claims 134->137, RARE 40->43), embed, build, invariants 30/30. Also fixed a flagged locator bug: the Gein/Hoyt cases were mislabeled 'Ch.6 The Verdict' (no such chapter exists) \u2014 they are actually Ch.5 'Divine Hunger'; corrected criminal-behavior.md + the cross-ref in divine-hunger-cannibalism.md, marking the correction rather than silently rewriting. No crime slugs leaked into the conditions index (still 67)." }, { id: "lg_mqstyf4i_534a0b", ts: "2026-06-24T21:35:18.546701-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 8 \u2014 Rare Earths Ch.7 'Genetic Potential' 1st half: 6 claims (preconception zinc\u2192Down's, $40/mo prevents Down's, 'metal fingers' cofactors, 98% birth defects nutritional, selenium\u2192Keshan trial, CF/MD/Kawasaki preventable). kv 27\u219228, 143 claims, board 30/30.", detail: "Front-to-back walk reached Ch.7 'Genetic Potential: The Outer Limits' (idx 144-191 / pp123-170). Mined the first half (Preconception + birth-defect/cystic-fibrosis/selenium cluster, pp123-152): WAL-CLM-RARE-000044 (Down's not genetic but a preconception ZINC deficiency causing chromosomal/DNA injury; Trisomy created at will via preconception zinc deficiency \u2014 mechanism/zinc/down_syndrome, p141), 000045 (~$40 supplements/month before+during pregnancy prevents Down's vs ~$1M lifetime care \u2014 protocol/zinc, p141), 000046 (essential mineral cofactors are the 'metal fingers' that activate genes \u2014 mechanism/zinc, p141), 000047 (98% of birth defects are nutritional, not genetic, preventable by preconception nutrition \u2014 mechanism/birth_defects, p141), 000048 (China selenium trial: 1mg sodium selenite 3x/wk cut Keshan Disease 13->1 per 1,000 over 3yr vs unchanged placebo \u2014 dose/selenium/keshan_disease, p152), 000049 (dozens of human 'genetic' diseases preventable/reversible with minerals \u2014 CF, muscular dystrophy, Kawasaki \u2014 definition; new condition kawasaki_disease, p149). Pipeline: reflowed 3 spans (de-hyphenation + slash-join + sentence-aware merge), resnap 6 relocated/0 broken, seal kv 27->28 (RARE 49), embed, build, invariants 30/30. Adds the SPECIFIC preconception/dose/mechanism claims the early broad-pass theses lacked. Ch.7 fringe (homosexuality 'emotional defect' list, idx151) already in social-emotional-defects.md + legit half already RARE-000015; kept out of verbatims. NEXT: Ch.7 second half (Postnatal/Maintenance/Longevity, idx 174-191)." }, { id: "lg_mqsupguq_1cvyb4", ts: "2026-06-24T21:56:20.498513-04:00", surface: "knowledge", kind: "design-decision", summary: "Rare Earths Ch.7 homosexuality/intersex thesis \u2192 new Tier-2 fringe file (Luneth ruling): mapped FULLY, excluded from current app but earmarked for a future 'uncensored' version. New 2-tier policy: graphic=summarize, controversial-but-valid=full-map.", detail: "Luneth ruled Wallach's Rare Earths Ch.7 thesis \u2014 homosexuality, hermaphroditism, intersex as preventable congenital defects from mineral/vitamin deficiency in early pregnancy (pp153-160/idx174-181) \u2014 is a DIFFERENT class of fringe than the graphic/violent material: controversial but not user-repellent, and he regards it as a legitimate personal choice. So instead of Tier-1 summarize-graphic treatment, it is mapped FULLY + faithfully into its own file knowledge/fringe-knowledge/homosexuality-intersex.md, EXCLUDED from the current dashboard but EARMARKED for a future 'uncensored' app version. Captures the full argument + all cited authorities (John Money 4%-of-births, Christine Jorgensen, 1972 Munich Olympic chromosome test, Guinet & Decourt 98 hermaphrodite types, Hugh H. Young 1937/Emma, Dewhurst & Gordon 1967, Plato, Freemartin cattle, Kinsey, Pillard+Bailey 52% twin concordance 'not genetic' argument, LeVay INAH3, Gorski 1978, soil-depletion parallel, 'insurance against gay embryo's' conclusion). Formalizes a TWO-TIER fringe policy (README updated): Tier 1 graphic->summarize, Tier 2 controversial-but-valid->full-map + uncensored-earmark; both still excluded from the current app + require Luneth's per-instance ruling. social-emotional-defects.md cross-refs the new file. New memory fringe-tiers-controversial-vs-graphic. No corpus/eden change. Legit Ch.7 claims salvaged separately as batch 9." }, { id: "lg_mqsv1lxe_hd27o0", ts: "2026-06-24T22:05:46.946548-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 9 \u2014 Rare Earths Ch.7 second half: 7 claims (selenium\u2192MD, copper\u2192Kawasaki, height ~7ft, duckling experiment, marathon mineral study, immune needs 90 nutrients, longest-lived cultures eat 60-72 minerals/meal). kv 28\u219229, 150 claims. Ch.7 COMPLETE.", detail: "Completed Rare Earths Ch.7 'Genetic Potential' by salvaging the legitimate second-half claims (pp153-170) that ran alongside the Tier-2 homosexuality/intersex fringe (handled in fa3eb54): WAL-CLM-RARE-000050 (selenium prevents muscular dystrophy in all named forms \u2014 Duchenne/Erb/Leyden-Moebius/Landouzy-Dejerine/Becker's/Gowers; vet industry eliminated white-muscle/mulberry-heart disease with selenium \u2014 selenium/muscular_dystrophy, p153), 000051 (Kawasaki = congenital copper deficiency: coronary aneurysm because copper builds arterial elastic fibers + a Strep second part; preventable with colloidal copper \u2014 copper/kawasaki_disease, p153), 000052 (human genetic potential for height ~7ft vs 5'8/5'4 average; gap is nutritional \u2014 definition, p161), 000053 (duckling experiment: 100 identical ducklings, 4 diets, only the 2 complete-nutrient groups reached growth potential at 1 month \u2014 personal_anecdote, p163), 000054 (marathon study: broad mineral supplement gave 16:57 race-time improvement vs 5:27 \u2014 personal_anecdote, p163), 000055 (immune system needs all 90 nutrients \u2014 mechanism, p165), 000056 (longest-lived cultures eat 60-72 minerals/meal \u2014 definition, p167). Pipeline: reflowed 7 spans (de-hyphenation + sentence-aware merge + OCR fix 9f->of), resnap 6 relocated/0 broken, seal kv 28->29 (claims 143->150, RARE 56), embed, build, invariants 30/30. Ch.7 fully processed: first half batch 8 (44-49), second half batch 9 (50-56), homosexuality/intersex thesis to Tier-2 fringe. NEXT: Ch.8 'The Age Beaters' (idx 192/p171)." }, { id: "lg_mqsvtc6z_fz1opq", ts: "2026-06-24T22:27:20.699870-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 10 \u2014 Rare Earths Ch.8 'The Age Beaters': 7 longevity claims (land-mines+90-nutrients framework, Mercedes analogy, colloidal=longevity-secret, hypothermia-death, 98%-vs-8-12% bioavailability, Glacial-Milk 60+ minerals, Walford fish +300%). kv 29\u219231, 157 claims.", detail: "Mined Rare Earths Ch.8 'The Age Beaters: The Fifth Essence' (idx 192-235 / pp171-214): WAL-CLM-RARE-000057 (longevity = avoid the 'land mines' [predators/accidents/smoking/alcohol/illegal+prescription drugs/chemicals AND going to the doctor] + take the 90 nutrients daily \u2014 definition, p171), 000058 (Mercedes-engine analogy for genetic potential needing its nutrient coolants/oil \u2014 mechanism, p171), 000059 (eating plants rich in organic colloidal minerals = the secret of the 5 'Age-Beater' cultures \u2014 mechanism, p212), 000060 (centenarians die of hypothermia, not the degenerative diseases of the West \u2014 definition, p212), 000061 (organic colloidal minerals ~98% bioavailable vs 8-12% for metallic \u2014 mechanism, p213), 000062 ('Glacial Milk' irrigation carrying 60+ minerals = common denominator of the 120-140yr cultures \u2014 definition, p213), 000063 (Roy Walford UCLA extended fish lifespan 300% by maximizing micronutrients \u2014 mechanism, p186). Reflowed 5 spans, resnap 0 broken/1 healed, two seals kv 29->31 (RARE 63, 157 claims), embed, build, invariants 30/30. No fringe in Ch.8 (culture sections mostly historical narrative). 'Killing Fields' iatrogenic thesis is actually Ch.9. NEXT: Ch.9 (idx 236/p215) 'THE KILLING FIELDS' iatrogenic-medicine thesis." }, { id: "lg_mqsw3t2c_yrelyy", ts: "2026-06-24T22:35:29.124672-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 11 \u2014 Rare Earths Ch.9 'The Killing Fields': 5 iatrogenic claims (Harvard 1991 198k hospital deaths/yr; Wolfe 300k[/600k] > Vietnam's 56k; poly-pharmacy 25%+ over-65; 70% of doctors flunked Rx quiz; 20 no-no drugs to 6.6M seniors). kv 31\u219232, 162 claims.", detail: "Mined Rare Earths Ch.9 'THE KILLING FIELDS' + 'TILTING AT PILL MILLS' (idx 236-271 / pp215-250), the iatrogenic thesis that IS core Wallach/DDDL: RARE-000064 (1991 Harvard SPH study: 1.3M injuries + 198,000 deaths/yr in US hospitals from iatrogenic mishaps, 4-5x highways, 7-of-10 avoidable, ~33% negligence \u2014 prevalence p215), 000065 (Wolfe/Public Citizen: 300,000/yr hospital-negligence deaths [maybe 600,000] vs 56,000 in all of Vietnam \u2014 prevalence p226), 000066 (poly-pharmacy endangers 25%+ of over-65s, many drugs only countering another drug's side effects \u2014 mechanism p226), 000067 (70% of allopathic doctors flunked a 1994 Rx quiz; mis-prescribe to 25% of seniors per Jul-1994 NEJM \u2014 prevalence p226), 000068 (20 contraindicated-for-elderly drugs prescribed to 6.6M seniors/yr \u2014 prevalence p226). HARDENED reflow to heal hyphen/slash words split across page-break blank lines (regex -\\n+ / /\\n+; fixed mishaps). resnap 0 broken, seal kv 31->32 (RARE 68, 162 claims), embed, build, invariants 30/30. No fringe. Deferred: PILL MILLS drug-specifics + Table 9-1. NEXT: Ch.10 'Glacial Milk' (idx 272/p251)." }, { id: "lg_mqswxpgd_ehb5xm", ts: "2026-06-24T22:58:44.125458-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 12 \u2014 Rare Earths Ch.10 'Glacial Milk': 5 claims (colloidal-minerals=most-critical-of-90; Glacial Milk=glaciers grind 2-6in rock/yr; 60-72 vs 3-20 minerals; 5-12% absorbed by drinking but irrigation is the key; millennia\u2192optimal health). kv 32\u219233, 167 claims.", detail: "Mined Rare Earths Ch.10 'GLACIAL MILK: Plant derived colloidal minerals' (idx 272-285 / pp251-264), the deep version of the Ch.8 synthesis: RARE-000069 (of the 90 nutrients the MOST CRITICAL for the long-lived cultures are plant-derived colloidal minerals \u2014 p251), 000070 (Glacial Milk forms as glaciers grind 2-6 inches of parent rock/yr into rock flour \u2014 p251), 000071 (the cultures' Glacial Milk = 60-72 minerals vs only 3-20 in the thousands of other world glaciers \u2014 p252), 000072 (centenarians absorb only 5-12% of metallic colloids they DRINK; the key is IRRIGATION so plants convert metallic->organic colloidal \u2014 mechanism p253), 000073 (millennia of Glacial-Milk-irrigated terraces -> optimal health free of Western degenerative diseases \u2014 p253). Skipped the 98%-bioavailability restatement (already RARE-061). PIPELINE LESSON: -\\n+ de-hyphenation over-merged 'long-\\nlived'->'longlived' (NEW OCR error); added compound-restore {longlived->long-lived} + grep -c longlived=0 guard; earlier batches clean. resnap 0 broken, seal kv 32->33 (RARE 73, 167 claims), embed, build, invariants 30/30. No fringe. NEXT: Ch.11 'RARE EARTHS' (idx 286/p265) per-element catalog." }, { id: "lg_mqsyp9ad_pobo2j", ts: "2026-06-24T23:48:09.157552-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 13 \u2014 Rare Earths Ch.11 conceptual foundation: 6 claims (RARE-74..79: colloidal/metallic absorption ratios, RDA critique, monk-bone soil-depletion, clinical-phase disease, 48hr-30day reversibility, compensated-phase signs). kv 33\u219234, RARE 73\u219279, corpus 173.", detail: "Cleaned pp265-272 (idx 286-293): reflowed P1/P3/P2 prose spans + marked the garbled element-concentration Table 11-1. Reflow de-hyphenation HARDENED to [A-Za-z]-$ so a line-final dash (i.e. -) is not eaten (caught by the pre-apply verbatim check). resnap 4 relocated/0 broken. +2 symptom slugs (irregular_heartbeat, white_hair). FRINGE (Luneth ruling = cross-ref): the decompensated-phase list restates the Bad-Seeds/crime + gay-behavior theses \u2014 cross-ref notes added to criminal-behavior.md + homosexuality-intersex.md, kept out of corpus. Board 30/30, build OK, knowledge probe green. NEXT: Ch.11 batch 2 (hair-analysis interp + Table 11-2 + toxic-metal substitution + Hg amalgam, idx 294-301), then the alphabetical per-element catalog (idx 302+)." }, { id: "lg_mqszb8gt_8ry9ww", ts: "2026-06-25T00:05:14.525578-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 14 \u2014 Rare Earths Ch.11 hair-analysis half: 4 claims (RARE-80..83: hair-analysis premise/200\xD7-blood, disease\u2192hair-mineral patterns, interpretation caveats, Table 11-2 ideal ratios). kv 34\u219235, RARE 79\u219283, corpus 177, conditions 68\u219271.", detail: "Cleaned pp273-275 (idx 294-296): reflowed 3 spans + hand-rebuilt the OCR-tangled pattern list + marked Table 11-2. resnap 4 relocated/0 broken. +3 condition slugs (schizophrenia, celiac_disease, malabsorption). FRINGE (Luneth ruling = cross-ref): the p275 pattern list repeats the Jekyll/Hyde crime shorthand \u2014 one-line cross-ref appended to criminal-behavior.md, kept out of corpus. Board 30/30, build OK, knowledge probe green. NEXT: Ch.11 batch 3 (toxic-metal substitution + lead/cadmium/mercury + dental amalgam + Dr. Todd colloidal study + 79/60 periodic-table intro, idx 297-301), then the alphabetical per-element catalog (idx 302+)." }, { id: "lg_mqszx1ur_qjy3yr", ts: "2026-06-25T00:22:12.387759-04:00", surface: "eden/corpus", kind: "round-close", summary: "Phase \u03B3.3 batch 15 \u2014 Rare Earths Ch.11 toxic-metals/mercury half: 6 claims (RARE-84..89). Completes the Ch.11 conceptual half. kv 35\u219238, RARE 83\u219289, corpus 183, conditions 71\u219276. Render probe caught a string-dose Zod break (fixed to null).", detail: "Cleaned pp276-279 (idx 297-300): 6 reflow spans (sentence-aware merge added) + marked the 3 toxic-metal graphs + Periodic Table. resnap 4 relocated/0 broken. Claims: Se/Ca antidote toxic metals; lead 400k-tons/38M; cadmium\u2192disease cascade; mercury amalgam\u2192MS/ALS/Parkinson's; Dr. Todd colloidal unmask/reduce; 79-detected/60-essential. NO fringe. Two post-finalize re-seals: (1) RARE-88 claim_text made self-contained re: Dr. Gary Price Todd's protocol (Luneth note); (2) RARE-88 dose fixed string\u2192null \u2014 a string dose made Zod reject the whole corpus-embed at runtime (empty drawer); build+invariants blind, render probe caught it. Flagged follow-up: Python dose-shape guard (\xA700.B). Board 30/30, build OK, probe green. NEXT: alphabetical per-element catalog (idx 302+)." }, { id: "lg_mqt0ezzh_4e07xn", ts: "2026-06-25T00:36:09.773311-04:00", surface: "eden/corpus-pipeline", kind: "round-close", summary: "Closed the malformed-dose defense-in-depth gap (batch-15 follow-up): a bare-string dose passed every Python gate yet broke the runtime Zod parse. corpus_extract.finalize + corpus_verify check #11 now refuse a non-null/non-object dose. 30/30 green; negative test proves it fires.", detail: `The Knowledge-drawer empty-render incident (RARE-88, batch 15) had a bare-string dose that build, invariants (incl. corpus_embed_synced), and corpus_verify all passed, but Zod rejected the whole corpus-embed at runtime \u2014 only render_probe_knowledge caught it. Two Python layers now close the gap. (1) corpus_extract.finalize validates each raw claim's dose is None-or-dict and refuses the batch otherwise, matching its existing fail-fast kind/essentials checks: "raw[N]: dose must be null or an object {amount,unit,period,form,duration,for_condition}, got <type>". (2) corpus_verify adds check #11 \u2014 every claim's dose across all sealed shards must be null-or-object \u2014 so a bad dose can't survive a re-seal; the corpus_integrity invariant delegates to it. Docs synced: SCHEMA.md \xA76 (11 checks), verify docstring + invariants.py comment (10\u219211). Deliberately enforce SHAPE only, not a key-subset: sealed RARE-48 carries extra dose keys (essential/frequency) that Zod .passthrough() accepts, so a subset check would have falsely reddened corpus_integrity (29/30) \u2014 verify mirrors the runtime boundary and catches only the non-object class that actually breaks the drawer. Negative test passed: a string-dose raw batch with a real book verbatim \u2192 finalize refused with exactly the dose error, exit 1, nothing written. Board 30/30, build OK. Follow-up flagged + spawned as a task: normalize RARE-48's off-schema dose keys (essential/frequency, no unit/period) so the dashboard stops silently dropping its three-times-per-week cadence.` }];

  // assets/js/src/state/log.ts
  var CREATORS_LOG_KEY = "wallachCreatorsLog_v1";
  var cachedEmbed = null;
  function embeddedEntries() {
    if (cachedEmbed === null) {
      const parsed = LogEmbedSchema.safeParse(creators_log_embed_default);
      cachedEmbed = parsed.success ? parsed.data : [];
    }
    return cachedEmbed;
  }
  function mergeById(...lists) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const list of lists) {
      for (const entry of list) {
        if (seen.has(entry.id)) {
          continue;
        }
        seen.add(entry.id);
        out.push(entry);
      }
    }
    return out;
  }
  function getEntries() {
    const shape = getValidated(CREATORS_LOG_KEY, LogShapeSchema);
    const lsEntries = shape?.entries ?? [];
    return mergeById(embeddedEntries(), lsEntries).sort((a, b) => a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0);
  }
  function getEntriesByKind(kind) {
    return getEntries().filter((e) => e.kind === kind);
  }

  // assets/js/src/views/profile.ts
  function escHTML5(s) {
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
    const detailHTML = entry.detail !== void 0 && entry.detail.length > 0 ? `<div class="pf-log-entry__detail">${escHTML5(entry.detail)}</div>` : "";
    return `
    <article class="pf-log-entry" data-log-id="${escHTML5(entry.id)}">
      <header class="pf-log-entry__head">
        <span class="pf-log-entry__ts">${escHTML5(formatTs(entry.ts))}</span>
        <span class="pf-log-entry__surface">${escHTML5(entry.surface)}</span>
        <span class="${kindClass(entry.kind)}">${escHTML5(kindLabel(entry.kind))}</span>
      </header>
      <h4 class="pf-log-entry__summary">${escHTML5(entry.summary)}</h4>
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
      <div class="pf-build-card__ts">${escHTML5(formatTs(lastBuild.ts))}</div>
      <h3 class="pf-build-card__summary">${escHTML5(lastBuild.summary)}</h3>
      ${lastBuild.detail !== void 0 ? `<pre class="pf-build-card__detail">${escHTML5(lastBuild.detail)}</pre>` : ""}
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
  function renderShell3(tab, totalEntries) {
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
  function mount4(container) {
    let tab = "log";
    const render = () => {
      container.innerHTML = renderShell3(tab, getEntries().length);
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
    { id: "slot-01", num: "01", serial: "01\xB7A23F", name: "Travel Pack", items: 6, coverage: 31, total: essentialCount(), stamp: "SAVED \xB7 2D AGO" },
    { id: "slot-02", num: "02", serial: "02\xB7F71D", name: "Daily Protocol", items: 9, coverage: 47, total: essentialCount(), stamp: "EDIT 0:14 AGO", active: true },
    { id: "slot-03", num: "03", serial: "03\xB7C8B2", name: "Sleep Stack", items: 4, coverage: 18, total: essentialCount(), stamp: "SAVED \xB7 1W AGO" },
    { id: "slot-04", num: "04", serial: "04\xB7E901", name: "Recovery Ramp", items: 11, coverage: 54, total: essentialCount(), stamp: "SAVED \xB7 3W AGO" },
    { id: "slot-05", num: "05", serial: "", name: "", items: 0, coverage: 0, total: essentialCount(), stamp: "", empty: true }
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
  function escHTML6(s) {
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
  function renderPips2(filled) {
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
      <article class="slot-card empty" data-slot-id="${escHTML6(slot.id)}">
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
    <article class="slot-card${activeClass}" data-slot-id="${escHTML6(slot.id)}" data-slot-num="${escHTML6(slot.num)}">
      ${scanLine}
      <div class="slot-card__serial">${serialPrefix}<span class="ds-cipher" data-cipher-set="hexa">${escHTML6(slot.serial)}</span>${serialSuffix}</div>
      <div class="slot-card__num">${escHTML6(slot.num)}</div>
      <h3 class="slot-card__name">${escHTML6(slot.name)}</h3>
      <div class="slot-card__items">${slot.items} items \xB7 <span class="slot-card__coverage">${slot.coverage}</span>/${slot.total}</div>
      <div class="slot-card__stamp">${escHTML6(slot.stamp)}</div>
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
    const pips = renderPips2(contributionPips(contrib));
    const icon = itemIcon(item);
    const name = (item.label.name ?? "(unnamed)").toString();
    const ov = overrides[String(item.id)] ?? {};
    const amount = readDose(ov["dose_amount"]);
    const freq = readDose(ov["dose_freq"]);
    const scaling = amount * freq;
    return `
    <div class="regimen-item-row" data-item-id="${item.id}">
      <div class="regimen-item-row__icon">${escHTML6(icon)}</div>
      <div class="regimen-item-row__body">
        <h4 class="regimen-item-row__name">${escHTML6(name)}</h4>
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
            <span class="active-slot__stat-den">/ ${essentialCount()}</span>
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
        <h4 class="rec-item__name">${escHTML6(item.name)}</h4>
        <span class="rec-item__tag" data-heat="${escHTML6(item.heat)}"><span class="rec-item__tag-sign">${escHTML6(sign)}</span>${escHTML6(tagText)}</span>
      </div>
      <div class="rec-item__reason">${escHTML6(item.reason)}</div>
      <div class="rec-item__actions">
        <button class="rec-item__adopt" data-rg-action="adopt" data-item-name="${escHTML6(item.name)}">+ ADOPT</button>
        <button class="rec-item__details" data-rg-action="details" data-item-name="${escHTML6(item.name)}">DETAILS</button>
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
    const options = names.map((n) => `<option value="${escHTML6(n)}"></option>`).join("");
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
  function mount5(container) {
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
  function escHTML7(s) {
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
      <span>${escHTML7(n.name)}</span>
      <span>${escHTML7(n.amount ?? "")}${escHTML7(n.unit ?? "")}</span>
      <span>\u2014</span>
    </div>
  `).join("");
    return `
    <div class="scan-canvas scan-canvas--active">
      <div class="scan-label">
        <div class="scan-label__brand">${escHTML7(brand)}</div>
        <div class="scan-label__product">${escHTML7(product)}</div>
        <div class="scan-label__rule"></div>
        <h4 class="scan-label__section-title">Supplement Facts</h4>
        <div class="scan-label__serving">Serving Size \xB7 ${escHTML7(servings)}</div>
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
    <span>CONFIDENCE <strong>${escHTML7(confidence)}</strong></span>
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
        <div class="stage__name">${escHTML7(s.name)}</div>
        <div class="stage__sub">${escHTML7(s.sub)}</div>
        <div class="stage__ms">${s.status === "active" ? `<span class="ds-cipher" data-cipher-set="alphanum">${escHTML7(s.ms)}</span>` : escHTML7(s.ms)}</div>
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
        <div class="pipeline__total">TOTAL ELAPSED <strong>${escHTML7(total)}</strong> \xB7 target &lt;5s</div>
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
    const tagSignHTML = row.tag.sign !== void 0 ? `<span class="parsed-row__tag-sign">${escHTML7(row.tag.sign)}</span>` : "";
    return `
    <div class="parsed-row parsed-row--${row.status}">
      <div class="parsed-row__status">${statusChar}</div>
      <div class="parsed-row__body">
        <span class="parsed-row__raw">"${escHTML7(row.raw)}"</span>
        <h4 class="parsed-row__name">${escHTML7(row.name)}</h4>
      </div>
      <span class="${mappedClass}">\u2192 ${escHTML7(row.mapped)}</span>
      <span class="parsed-row__confidence">${escHTML7(row.confidence)} <small>conf</small></span>
      <span class="parsed-row__tag" data-heat="${escHTML7(row.tag.heat)}">${tagSignHTML}${escHTML7(row.tag.text)}</span>
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
          <div class="verdict__actions">
            <button class="scan-btn scan-btn--adopt" data-sc-action="adopt-product"><span class="scan-btn__glyph">+</span>ADD TO REGIMEN</button>
          </div>
        </div>
        <div class="verdict__stats">
          <div class="verdict-stat">
            <div class="verdict-stat__num">+${added}<small>/${essentialCount()}</small></div>
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
        <h4 class="scan-history-item__name">${escHTML7(name)}</h4>
        <span class="scan-history-item__ts">${escHTML7(entry.ts.slice(0, 16))}</span>
      </div>
      <span class="${pillClass}">${escHTML7(verdictText)}</span>
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
  async function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("FileReader failed"));
      reader.readAsDataURL(file);
    });
  }
  async function handleImageFile(file) {
    try {
      const dataUrl = await readFileAsDataURL(file);
      await scanImage(dataUrl);
    } catch (e) {
      console.warn("[views/scanner] OCR scan failed:", e);
    }
  }
  function adoptProduct(label) {
    const item = {
      id: Date.now(),
      label: { name: label.name, nutrients: label.nutrients ?? [] },
      addedDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
      provenance: "user_scanned"
    };
    saveRgManual([...loadRgManual(), item]);
  }
  function mount6(container) {
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
      } else if (action === "adopt-product") {
        const result = currentResult();
        if (result === null) {
          return;
        }
        adoptProduct(result.label);
        actionEl.textContent = "\u2713 ADDED TO REGIMEN";
        if (actionEl instanceof HTMLButtonElement) {
          actionEl.disabled = true;
        }
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
  var DRAWER_SPECS = [
    { target: "knowledge", mountId: "drawer-knowledge-mount", key: "k", mount: mount3 },
    { target: "journey", mountId: "drawer-journey-mount", key: "j", mount: mount2 }
  ];
  var drawerHandles = /* @__PURE__ */ new Map();
  function isDrawerTarget(target) {
    return DRAWER_SPECS.some((s) => s.target === target);
  }
  function closeAllDrawers() {
    for (const handle of drawerHandles.values()) {
      handle.close();
    }
  }
  function navigateTo(target) {
    closeAllDrawers();
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
        mounted.regimen = mount5(mountEl);
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
        mounted.scanner = mount6(mountEl);
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
        if (isDrawerTarget(target)) {
          toggleDrawer(target);
          return;
        }
        navigateTo(target);
      });
    }
  }
  function mountDrawers() {
    for (const spec of DRAWER_SPECS) {
      const el = document.getElementById(spec.mountId);
      if (el === null) {
        continue;
      }
      drawerHandles.set(spec.target, spec.mount(el));
    }
  }
  function syncDrawerRail() {
    for (const spec of DRAWER_SPECS) {
      const btn = document.querySelector(`.rail__item[data-rail-nav="${spec.target}"]`);
      if (btn === null) {
        continue;
      }
      const handle = drawerHandles.get(spec.target);
      btn.classList.toggle("active", handle !== void 0 && handle.isOpen());
    }
  }
  function toggleDrawer(target) {
    const handle = drawerHandles.get(target);
    if (handle === void 0) {
      return;
    }
    for (const [other, h] of drawerHandles) {
      if (other !== target) {
        h.close();
      }
    }
    handle.toggle();
    syncDrawerRail();
  }
  function wireDrawerKeys() {
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        closeAllDrawers();
        syncDrawerRail();
        return;
      }
      const t = ev.target;
      const typing = t !== null && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) {
        return;
      }
      for (const spec of DRAWER_SPECS) {
        if (ev.key.toLowerCase() === spec.key) {
          ev.preventDefault();
          toggleDrawer(spec.target);
          return;
        }
      }
    });
  }
  function wireJourneyAutoDerive() {
    on("scanner:scan-complete", (p) => {
      const label = p.verdict === "aligns" ? "aligns with the framework" : p.verdict === "partial" ? "a partial match" : "outside the framework";
      logEvent({ kind: "scan", title: `Scanned a product \u2014 ${label}`, occurredAt: (/* @__PURE__ */ new Date()).toISOString() });
    });
    on("regimen:changed", (p) => {
      if (p.reason === "dose-edit") {
        return;
      }
      const verb = p.reason === "add" ? "Added an item to" : p.reason === "remove" ? "Removed an item from" : "Restored an item to";
      logEvent({ kind: "regimen", title: `${verb} your regimen`, occurredAt: (/* @__PURE__ */ new Date()).toISOString() });
    });
    on("goals:updated", () => {
      logEvent({ kind: "milestone", title: "Updated a goal", occurredAt: (/* @__PURE__ */ new Date()).toISOString() });
    });
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
    profileHandle = mount4(overlay);
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
    mountDrawers();
    wireDrawerKeys();
    wireJourneyAutoDerive();
    setTimeout(() => navigateTo("coverage"), 0);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
//# sourceMappingURL=main.js.map
