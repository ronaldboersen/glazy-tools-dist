var i = {
        PRIMITIVE: [5, 9, 13, 17, 20, 23, 26, 29, 32, 35],
        BASE: [460, 110, 400, 440, 450, 1180],
        SUBTYPES: {
            CLAY: [120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390],
            SLIP: [410, 420, 430],
            GLAZE: [470, 480, 490, 500, 510, 520, 530, 533, 535, 540, 550, 560, 570, 580, 585, 590, 600, 610, 620, 630, 635, 640, 650, 660, 670, 673, 675, 680, 690, 700, 710, 720, 730, 740, 745, 750, 760, 770, 780, 790, 800, 810, 820, 830, 840, 850, 860, 870, 875, 880, 890, 900, 910, 920, 930, 940, 950, 960, 970, 980, 990, 1e3, 1010, 1020, 1030, 1040, 1050, 1055, 1060, 1070, 1080, 1090, 1100, 1110, 1130, 1140, 1150, 1155, 1160, 1170]
        },
        BASE_TO_SUBTYPE: {
            110: "CLAY",
            400: "SLIP",
            460: "GLAZE"
        }
    },
    s = {
        DA: "da",
        DE: "de",
        EN: "en",
        ES_419: "es-419",
        ES: "es",
        FR: "fr",
        HR: "hr",
        IT: "it",
        JA: "ja",
        KO: "ko",
        NL: "nl",
        PT: "pt",
        RU: "ru",
        SL: "sl",
        SV: "sv",
        TH: "th",
        UK: "uk",
        ZH: "zh"
    },
    o = {
        PRIVATE: "private",
        PUBLIC: "public",
        GROUP: "group"
    },
    O = {
        SYSTEM: 1,
        PRIMITIVE_CREATE: 2,
        COMPOSITE_CREATE: 3,
        ANALYSIS_CREATE: 4,
        COMMENT_CREATE: 5,
        MATERIAL_REVIEW_CREATE: 6,
        MATERIAL_IMAGE_CREATE: 7,
        MATERIAL_PUBLISH: 8,
        USER_CREATE: 9,
        SUPPORT: 10,
        BLOG: 20,
        CHEMISTRY: 30,
        RESEARCH: 40,
        TECHNIQUES: 50,
        EVENTS: 60,
        EDUCATION: 70,
        EQUIPMENT: 80,
        BATCH: 90
    },
    u = {
        USER_UMF: "user_umf",
        UMF: "umf",
        EXTENDED_UMF: "xumf",
        PERCENT: "percent",
        MOLE: "mole"
    },
    c = [u.USER_UMF, u.UMF, u.EXTENDED_UMF, u.PERCENT, u.MOLE],
    l = {
        USER_UMF: "u",
        UMF: "t",
        EXTENDED_UMF: "x",
        MOLE: "m",
        PERCENT: "p"
    },
    d = {
        EXTENDED_UMF: "xumf",
        UMF: "umf",
        NONE: "none"
    },
    f = {
        EXTENDED_UMF: "x",
        UMF: "t",
        NONE: "n"
    },
    m = function(e) {
        return e.SiO2 = "SiO2", e.Al2O3 = "Al2O3", e.B2O3 = "B2O3", e.Li2O = "Li2O", e.Na2O = "Na2O", e.K2O = "K2O", e.KNaO = "KNaO", e.BeO = "BeO", e.MgO = "MgO", e.CaO = "CaO", e.SrO = "SrO", e.BaO = "BaO", e.P2O5 = "P2O5", e.TiO2 = "TiO2", e.ZrO = "ZrO", e.ZrO2 = "ZrO2", e.V2O5 = "V2O5", e.Cr2O3 = "Cr2O3", e.MnO = "MnO", e.MnO2 = "MnO2", e.FeO = "FeO", e.Fe2O3 = "Fe2O3", e.CoO = "CoO", e.NiO = "NiO", e.CuO = "CuO", e.Cu2O = "Cu2O", e.CdO = "CdO", e.ZnO = "ZnO", e.F = "F", e.PbO = "PbO", e.SnO2 = "SnO2", e.C = "C", e.CO2 = "CO2", e.H2O = "H2O", e.O = "O", e.Organics = "Organics", e.SO3 = "SO3", e.SO4 = "SO4", e.Ag2O = "Ag2O", e.AlF3 = "AlF3", e.As2O3 = "As2O3", e.As4O6 = "As4O6", e.Au2O3 = "Au2O3", e.BaF2 = "BaF2", e.Bi2O3 = "Bi2O3", e.CaF2 = "CaF2", e.CeO2 = "CeO2", e.Cl = "Cl", e.CO = "CO", e.CrO3 = "CrO3", e.Cs2O = "Cs2O", e.CuCO3 = "CuCO3", e.Dy2O3 = "Dy2O3", e.Er2O3 = "Er2O3", e.Eu2O3 = "Eu2O3", e.Fr2O = "Fr2O", e.Ga2O3 = "Ga2O3", e.GdO3 = "GdO3", e.GeO2 = "GeO2", e.HfO2 = "HfO2", e.HgO = "HgO", e.Ho2O3 = "Ho2O3", e.In2O3 = "In2O3", e.IrO2 = "IrO2", e.KF = "KF", e.La2O3 = "La2O3", e.Lu2O3 = "Lu2O3", e.Mn2O3 = "Mn2O3", e.MoO3 = "MoO3", e.N2O5 = "N2O5", e.NaF = "NaF", e.Nb2O5 = "Nb2O5", e.Nd2O3 = "Nd2O3", e.Ni2O3 = "Ni2O3", e.OsO2 = "OsO2", e.Pa2O5 = "Pa2O5", e.PbF2 = "PbF2", e.PdO = "PdO", e.PmO3 = "PmO3", e.PO4 = "PO4", e.Pr2O3 = "Pr2O3", e.PrO2 = "PrO2", e.PtO2 = "PtO2", e.RaO = "RaO", e.Rb2O = "Rb2O", e.Re2O7 = "Re2O7", e.RhO3 = "RhO3", e.RuO2 = "RuO2", e.Sb2O3 = "Sb2O3", e.Sb2O5 = "Sb2O5", e.Sc2O3 = "Sc2O3", e.Se = "Se", e.SeO2 = "SeO2", e.Sm2O3 = "Sm2O3", e.Ta2O5 = "Ta2O5", e.Tb2O3 = "Tb2O3", e.Tc2O7 = "Tc2O7", e.ThO2 = "ThO2", e.Tl2O = "Tl2O", e.Tm2O3 = "Tm2O3", e.U3O8 = "U3O8", e.UO2 = "UO2", e.WO3 = "WO3", e.Y2O3 = "Y2O3", e.Yb2O3 = "Yb2O3", e
    }({}),
    p = {
        [m.SiO2]: 60.08439,
        [m.Al2O3]: 101.96137,
        [m.B2O3]: 69.6217,
        [m.Li2O]: 29.8818,
        [m.Na2O]: 61.97897,
        [m.K2O]: 94.19605,
        [m.BeO]: 25.01158,
        [m.MgO]: 40.30449,
        [m.CaO]: 56.0778,
        [m.SrO]: 103.6204,
        [m.BaO]: 153.3271,
        [m.P2O5]: 141.9446,
        [m.TiO2]: 79.866,
        [m.ZrO]: 107.2234,
        [m.ZrO2]: 123.2231,
        [m.V2O5]: 181.88,
        [m.Cr2O3]: 151.99061,
        [m.MnO]: 70.93748,
        [m.MnO2]: 86.93691,
        [m.FeO]: 71.8446,
        [m.Fe2O3]: 159.6887,
        [m.CoO]: 74.93263,
        [m.NiO]: 74.69287,
        [m.CuO]: 79.5454,
        [m.Cu2O]: 143.0914,
        [m.CdO]: 128.4104,
        [m.ZnO]: 81.3814,
        [m.F]: 18.998403,
        [m.PbO]: 223.2094,
        [m.SnO2]: 150.7096,
        [m.HfO2]: 210.49,
        [m.Nb2O5]: 265.81,
        [m.Ta2O5]: 441.893,
        [m.MoO3]: 143.94,
        [m.WO3]: 231.84,
        [m.OsO2]: 222.23,
        [m.IrO2]: 224.216,
        [m.PtO2]: 227.08,
        [m.Ag2O]: 231.735,
        [m.Au2O3]: 441.93,
        [m.GeO2]: 104.61,
        [m.As2O3]: 197.841,
        [m.Sb2O3]: 291.518,
        [m.Bi2O3]: 465.959,
        [m.SeO2]: 110.96,
        [m.La2O3]: 325.809,
        [m.CeO2]: 172.115,
        [m.PrO2]: 172.906,
        [m.Pr2O3]: 329.813,
        [m.Nd2O3]: 336.48,
        [m.U3O8]: 842.082,
        [m.Sm2O3]: 348.72,
        [m.Eu2O3]: 351.926,
        [m.Tb2O3]: 365.849,
        [m.Dy2O3]: 373,
        [m.Ho2O3]: 377.858,
        [m.Er2O3]: 382.52,
        [m.Tm2O3]: 385.866,
        [m.Yb2O3]: 394.08,
        [m.Lu2O3]: 397.932
    },
    b = {
        [m.SiO2]: .035,
        [m.Al2O3]: .063,
        [m.B2O3]: .031,
        [m.Li2O]: .068,
        [m.Na2O]: .387,
        [m.K2O]: .331,
        [m.BeO]: 0,
        [m.MgO]: .026,
        [m.CaO]: .148,
        [m.SrO]: .13,
        [m.BaO]: .129,
        [m.TiO2]: .144,
        [m.ZrO]: .02,
        [m.ZrO2]: .02,
        [m.MnO]: .05,
        [m.MnO2]: .05,
        [m.Fe2O3]: .125,
        [m.ZnO]: .094,
        [m.PbO]: .083,
        [m.SnO2]: .02
    },
    g = (m.SiO2, m.Al2O3, m.B2O3, m.Na2O, m.K2O, m.MgO, m.CaO, m.SrO, m.BaO, m.TiO2, m.ZrO2, m.ZnO, m.PbO, {
        [m.SiO2]: "SiO₂",
        [m.Al2O3]: "Al₂O₃",
        [m.B2O3]: "B₂O₃",
        [m.Li2O]: "Li₂O",
        [m.Na2O]: "Na₂O",
        [m.K2O]: "K₂O",
        [m.KNaO]: "KNaO",
        [m.BeO]: "BeO",
        [m.MgO]: "MgO",
        [m.CaO]: "CaO",
        [m.SrO]: "SrO",
        [m.BaO]: "BaO",
        [m.P2O5]: "P₂O₅",
        [m.TiO2]: "TiO₂",
        [m.ZrO]: "ZrO",
        [m.ZrO2]: "ZrO₂",
        [m.V2O5]: "V₂O₅",
        [m.Cr2O3]: "Cr₂O₃",
        [m.MnO]: "MnO",
        [m.MnO2]: "MnO₂",
        [m.FeO]: "FeO",
        [m.Fe2O3]: "Fe₂O₃",
        [m.CoO]: "CoO",
        [m.NiO]: "NiO",
        [m.CuO]: "CuO",
        [m.Cu2O]: "Cu₂O",
        [m.CdO]: "CdO",
        [m.ZnO]: "ZnO",
        [m.F]: "F",
        [m.PbO]: "PbO",
        [m.SnO2]: "SnO₂",
        [m.C]: "C",
        [m.CO2]: "CO₂",
        [m.H2O]: "H₂O",
        [m.O]: "O",
        [m.Organics]: "Organics",
        [m.SO3]: "SO₃",
        [m.SO4]: "SO₄",
        [m.Ag2O]: "Ag₂O",
        [m.AlF3]: "AlF₃",
        [m.As2O3]: "As₂O₃",
        [m.As4O6]: "As₄O₆",
        [m.Au2O3]: "Au₂O₃",
        [m.BaF2]: "BaF₂",
        [m.Bi2O3]: "Bi₂O₃",
        [m.CaF2]: "CaF₂",
        [m.CeO2]: "CeO₂",
        [m.Cl]: "Cl",
        [m.CO]: "CO",
        [m.CrO3]: "CrO₃",
        [m.Cs2O]: "Cs₂O",
        [m.CuCO3]: "CuCO₃",
        [m.Dy2O3]: "Dy₂O₃",
        [m.Er2O3]: "Er₂O₃",
        [m.Eu2O3]: "Eu₂O₃",
        [m.Fr2O]: "Fr₂O",
        [m.Ga2O3]: "Ga₂O₃",
        [m.GdO3]: "GdO₃",
        [m.GeO2]: "GeO₂",
        [m.HfO2]: "HfO₂",
        [m.HgO]: "HgO",
        [m.Ho2O3]: "Ho₂O₃",
        [m.In2O3]: "In₂O₃",
        [m.IrO2]: "IrO₂",
        [m.KF]: "KF",
        [m.La2O3]: "La₂O₃",
        [m.Lu2O3]: "Lu₂O₃",
        [m.Mn2O3]: "Mn₂O₃",
        [m.MoO3]: "MoO₃",
        [m.N2O5]: "N₂O₅",
        [m.NaF]: "NaF",
        [m.Nb2O5]: "Nb₂O₅",
        [m.Nd2O3]: "Nd₂O₃",
        [m.Ni2O3]: "Ni₂O₃",
        [m.OsO2]: "OsO₂",
        [m.Pa2O5]: "Pa₂O₅",
        [m.PbF2]: "PbF₂",
        [m.PdO]: "PdO",
        [m.PmO3]: "PmO₃",
        [m.PO4]: "PO₄",
        [m.Pr2O3]: "Pr₂O₃",
        [m.PrO2]: "PrO₂",
        [m.PtO2]: "PtO₂",
        [m.RaO]: "RaO",
        [m.Rb2O]: "Rb₂O",
        [m.Re2O7]: "Re₂O₇",
        [m.RhO3]: "RhO₃",
        [m.RuO2]: "RuO₂",
        [m.Sb2O3]: "Sb₂O₃",
        [m.Sb2O5]: "Sb₂O₅",
        [m.Sc2O3]: "Sc₂O₃",
        [m.Se]: "Se",
        [m.SeO2]: "SeO₂",
        [m.Sm2O3]: "Sm₂O₃",
        [m.Ta2O5]: "Ta₂O₅",
        [m.Tb2O3]: "Tb₂O₃",
        [m.Tc2O7]: "Tc₂O₇",
        [m.ThO2]: "ThO₂",
        [m.Tl2O]: "Tl₂O",
        [m.Tm2O3]: "Tm₂O₃",
        [m.U3O8]: "U₃O₈",
        [m.UO2]: "UO₂",
        [m.WO3]: "WO₃",
        [m.Y2O3]: "Y₂O₃",
        [m.Yb2O3]: "Yb₂O₃"
    }),
    h = [m.Na2O, m.K2O, m.Li2O],
    y = [m.Na2O, m.K2O, m.Li2O, m.PbO, m.SrO, m.BaO, m.ZnO, m.CaO, m.MgO, m.MnO],
    A = [m.PbO, m.SrO, m.BaO, m.ZnO, m.CaO, m.MgO, m.MnO],
    N = [m.Al2O3, m.B2O3],
    v = [m.SiO2, m.ZrO2, m.SnO2, m.TiO2];
function S(e) {
    return Object.keys(m).includes(e)
}
function M(e, n) {
    return e && S(n) && e?.[n] || 0
}
var R = [{
        name: m.SiO2,
        type: "RO2"
    }, {
        name: m.Al2O3,
        type: "R2O3"
    }, {
        name: m.B2O3,
        type: "B2O3"
    }, {
        name: m.Li2O,
        type: "R2O"
    }, {
        name: m.Na2O,
        type: "R2O"
    }, {
        name: m.K2O,
        type: "R2O"
    }, {
        name: m.MgO,
        type: "RO"
    }, {
        name: m.CaO,
        type: "RO"
    }, {
        name: m.SrO,
        type: "RO"
    }, {
        name: m.BaO,
        type: "RO"
    }, {
        name: m.ZnO,
        type: "RO"
    }, {
        name: m.P2O5,
        type: "other"
    }, {
        name: m.TiO2,
        type: "other"
    }, {
        name: m.MnO,
        type: "other"
    }, {
        name: m.MnO2,
        type: "other"
    }, {
        name: m.FeO,
        type: "other"
    }, {
        name: m.Fe2O3,
        type: "other"
    }],
    C = [m.BeO, m.ZrO, m.ZrO2, m.V2O5, m.Cr2O3, m.CoO, m.NiO, m.CuO, m.Cu2O, m.CdO, m.F, m.PbO, m.SnO2, m.HfO2, m.Nb2O5, m.Ta2O5, m.MoO3, m.WO3, m.OsO2, m.IrO2, m.PtO2, m.Ag2O, m.Au2O3, m.GeO2, m.As2O3, m.Sb2O3, m.Bi2O3, m.SeO2, m.La2O3, m.CeO2, m.PrO2, m.Pr2O3, m.Nd2O3, m.U3O8, m.Sm2O3, m.Eu2O3, m.Tb2O3, m.Dy2O3, m.Ho2O3, m.Er2O3, m.Tm2O3, m.Yb2O3, m.Lu2O3, m.Y2O3],
    E = "separate",
    T = ["separate", "r2o", "ro", "r2o3", "ro2"],
    F = {
        r2o: [m.Na2O, m.K2O, m.Li2O],
        ro: [m.PbO, m.SrO, m.BaO, m.ZnO, m.CaO, m.MgO, m.MnO],
        r2o3: [m.Al2O3, m.B2O3],
        ro2: [m.SiO2, m.ZrO2, m.SnO2, m.TiO2]
    },
    B = {
        r2o: [m.Na2O, m.K2O, m.Li2O, m.Bi2O3, m.CuO, m.SnO2],
        ro: [m.PbO, m.SrO, m.BaO, m.ZnO, m.CaO, m.MgO, m.MnO, m.Fe2O3, m.MnO2, m.CoO],
        r2o3: [m.Al2O3, m.B2O3, m.TiO2, m.NiO],
        ro2: [m.SiO2, m.ZrO2]
    },
    x = {
        type: "default",
        oxides: F,
        boronBehavior: E
    },
    P = {
        type: "xumf",
        oxides: B,
        boronBehavior: E
    };
function j(e) {
    return function(e) {
        return "string" == typeof e && T.includes(e)
    }(e) ? e : E
}
function w(e) {
    return Array.isArray(e) ? Array.from(new Set(e.filter(e => "string" == typeof e && Boolean(m[e])))) : []
}
function I(e) {
    return {
        r2o: w(e.r2o).filter(e => e !== m.B2O3),
        ro: w(e.ro).filter(e => e !== m.B2O3),
        r2o3: w(e.r2o3).filter(e => e !== m.B2O3),
        ro2: w(e.ro2).filter(e => e !== m.B2O3)
    }
}
function K(e) {
    return "xumf" === e ? P : x
}
function k(e, n={}) {
    if ("xumf" === e.type)
        return P;
    if ("custom" !== e.type)
        return x;
    const t = e.oxides ?? F,
        r = e.boronBehavior ?? t.boronBehavior ?? (n.inferLegacyBoron ? w((a = t).r2o).includes(m.B2O3) ? "r2o" : w(a.ro).includes(m.B2O3) ? "ro" : w(a.ro2).includes(m.B2O3) ? "ro2" : E : "separate");
    var a;
    return {
        type: "custom",
        oxides: I(t),
        boronBehavior: j(r)
    }
}
function L(e) {
    return function(e, n=E) {
        return {
            ...I(e),
            boronBehavior: n
        }
    }(e.oxides, j(e.boronBehavior ?? e.oxides.boronBehavior))
}
var U = 1e-9;
function Z(e) {
    return e ? Object.entries(e).reduce((e, [n, t]) => m[n] && "number" == typeof t ? e + t : e, 0) : 0
}
function D(e) {
    return Object.entries(e).reduce((e, [n, t]) => (t && t > 0 && (e[n] = t), e), {})
}
function z(e, n) {
    return n.reduce((n, t) => n + (e[t] || 0), 0)
}
function H(e) {
    return j(e?.boronBehavior ?? "separate")
}
function _(e, n) {
    const t = function(e) {
        return e.filter(e => e !== m.B2O3)
    }(e);
    return n ? [...t, m.B2O3] : t
}
function G(e) {
    return _(e?.r2o ?? h, "r2o" === H(e))
}
function Y(e) {
    return _(e?.ro ?? A, "ro" === H(e))
}
function V(e) {
    return Array.from(new Set([...Y(e), ...G(e)]))
}
function $(e) {
    return V(e)
}
function W(e) {
    return _(e?.r2o3 ?? N, "r2o3" === H(e))
}
function J(e) {
    return _(e?.ro2 ?? v, "ro2" === H(e))
}
function X(e, n) {
    return n ? {
        ...e,
        loi: n
    } : e
}
function Q(e, n, t={}) {
    const r = e?.loi ?? 0,
        a = {
            ...e
        };
    "loi" in a && delete a.loi;
    const i = ne(a),
        s = t.umfOxides,
        o = (e, n) => {
            const t = function(e, n) {
                return !n || n <= U ? D(e) : Object.entries(e).reduce((e, [t, r]) => (r && r > 0 && (e[t] = r / n), e), {})
            }(i, n);
            return {
                unityType: e,
                formula: t,
                percentage: X(te(t, r), r),
                ratio: n
            }
        },
        O = {
            unityType: "none",
            formula: D(i),
            percentage: X({
                ...a
            }, r),
            ratio: 1
        };
    switch (n) {
    case "none":
    default:
        return O;
    case "r2o3":
        {
            const e = z(i, W(s));
            return e > U ? o("r2o3", e) : O
        }case "umf":
        {
            const e = z(i, V(s));
            return e > U ? o("umf", e) : O
        }case "unity":
        {
            const e = Math.max(...Object.values(i), 0);
            return e > U ? o("unity", e) : O
        }case "auto":
        {
            const e = z(i, V(s));
            if (e > 6)
                return o("umf", e);
            const n = z(i, W(s));
            if (n > U)
                return o("r2o3", n);
            const t = Math.max(...Object.values(i), 0);
            return t > U ? o("unity", t) : O
        }
    }
}
function q(e, n, t) {
    if (!e)
        return;
    let r;
    r = n || (t && (t.r2o || t.ro) ? [...V(t)] : y);
    const a = ne(e),
        i = r.reduce((e, n) => e + (a[n] || 0), 0);
    if (i <= 0)
        return {};
    const s = Object.entries(a).reduce((e, [n, t]) => {
        const r = n;
        if (m[r] && t) {
            const n = t / i;
            return n > 0 ? {
                ...e,
                [r]: n
            } : e
        }
        return e
    }, {});
    return {
        ...s,
        SiO2Al2O3Ratio: ae(s),
        RO2R2O3Ratio: se(s, t),
        hasAdditionalR2O3Oxides: oe(s, t),
        R2OTotal: ce(s, G(t)),
        ROTotal: le(s, Y(t))
    }
}
function ee() {
    return {}
}
function ne(e) {
    return e ? Object.entries(e).reduce((e, [n, t]) => {
        const r = n;
        return m[r] && t && t > 0 && p[r] && (e[r] = t / p[r]), e
    }, {}) : {}
}
function te(e, n=0) {
    const t = {};
    if (!e)
        return t;
    let r = 0;
    for (const [i, s] of Object.entries(e)) {
        s > 0 && p[i] && (r += s * p[i])
    }
    if (r <= 0)
        return t;
    const a = 100 - n;
    for (const [i, s] of Object.entries(e)) {
        const e = i;
        s > 0 && p[e] && (t[e] = s * p[e] / r * a)
    }
    return n > 0 && (t.loi = n), t
}
function re(e) {
    if (!e)
        return {};
    const n = ne(e),
        t = Z(n);
    return t <= 0 ? {} : Object.entries(n).reduce((e, [n, r]) => ({
        ...e,
        [n]: r ? r / t * 100 : 0
    }), {})
}
function ae(e) {
    const n = e[m.SiO2] || 0,
        t = e[m.Al2O3] || 0;
    return n && t ? n / t : 0
}
function ie(e) {
    return Boolean(e && ae(e) > U)
}
function se(e, n) {
    const t = J(n).reduce((n, t) => n + (e[t] || 0), 0),
        r = W(n).reduce((n, t) => n + (e[t] || 0), 0);
    return t && r ? t / r : 0
}
function oe(e, n) {
    return W(n).some(n => n !== m.Al2O3 && (e[n] || 0) > U)
}
function Oe(e) {
    return "number" == typeof e.RO2R2O3Ratio ? e.RO2R2O3Ratio : se(e)
}
function ue(e) {
    return !!e && (!(Oe(e) <= U) && ("boolean" == typeof e.hasAdditionalR2O3Oxides ? e.hasAdditionalR2O3Oxides : !!function(e) {
            return Object.values(m).some(n => (e[n] || 0) > U)
        }(e) && oe(e)))
}
function ce(e, n) {
    return (n || G()).reduce((n, t) => n + (e[t] || 0), 0)
}
function le(e, n) {
    return (n || Y()).reduce((n, t) => n + (e[t] || 0), 0)
}
function de(e) {
    if (!e)
        return {};
    const n = Z(e);
    return n <= 0 ? {} : Object.entries(e).reduce((e, [t, r]) => m[t] && r ? {
        ...e,
        [t]: r / n * 100
    } : e, {})
}
function fe(e, n, t) {
    const r = t ? {
        R2O: G(t),
        RO: Y(t),
        R2O3: W(t),
        RO2: J(t)
    } : n || {
        R2O: h,
        RO: A,
        R2O3: N,
        RO2: v
    };
    return Object.entries(e).reduce((e, [n, a]) => {
        const i = n;
        if (!a || !m[i])
            return e;
        if (i === m.B2O3) {
            const n = t ? function(e) {
                switch (H(e)) {
                case "r2o":
                    return "R2O";
                case "ro":
                    return "RO";
                case "r2o3":
                    return "R2O3";
                case "ro2":
                    return "RO2";
                default:
                    return "B2O3"
                }
            }(t) : "B2O3";
            return {
                ...e,
                [n]: {
                    ...e[n],
                    [i]: a
                }
            }
        }
        const s = Object.entries(r).find(([, e]) => e && e.some(e => String(e) === String(n)))?.[0] || "other";
        return {
            ...e,
            [s]: {
                ...e[s],
                [i]: a
            }
        }
    }, {
        R2O: {},
        RO: {},
        R2O3: {},
        B2O3: {},
        RO2: {},
        other: {}
    })
}
function me(e) {
    if (!(e && e?.length > 0))
        return [];
    const n = new Set;
    for (const t of e) {
        const e = be(t.material?.analysis);
        for (const t of e)
            n.add(t)
    }
    return Object.values(m).filter(e => n.has(e))
}
function pe(e) {
    if (!e)
        return {};
    const n = {
        ...e
    };
    delete n.K2O,
    delete n.Na2O;
    const t = function(e) {
        return e ? (e[m.K2O] || 0) + (e[m.Na2O] || 0) : 0
    }(e);
    return t > 0 ? {
        ...n,
        KNaO: t
    } : n
}
function be(e) {
    if (!e)
        return [];
    const n = [];
    for (const t of Object.keys(e)) {
        const r = t;
        m[r] && (e[r] || 0) > 0 && n.push(r)
    }
    return n
}
function ge(e) {
    return e ? Object.entries(e).reduce((e, [n, t]) => t && t > 0 && b[n] ? e + t * b[n] : e, 0) : 0
}
function he(e) {
    return e ? ge(re(e)) : 0
}
function ye(e, n=1, t=!0) {
    return e ? "string" == typeof e ? e : Object.entries(e).filter(([e]) => m[e]).filter(([, e]) => t || e && e > 0).map(([e, t]) => `${e}: ${Number(t).toFixed(n)}`).join(", ") : ""
}
function Ae(e) {
    if (!e || 0 === Object.keys(e).length)
        return !1;
    if (!function(e, n=y) {
        return n.some(n => (e[n] || 0) > 0)
    }(e))
        return !1;
    const n = (e[m.SiO2] || 0) > 0,
        t = (e[m.Al2O3] || 0) > 0;
    return n && t
}
var Ne = 0,
    ve = 0;
function Se() {
    const e = Date.now();
    return e === Ne ? ve++ : (Ne = e, ve = 0), -(1e3 * e + ve)
}
function Me({id: e=Se(), name: n="Fake Material", isAnalysis: t=!1}={}) {
    return {
        id: e,
        name: n,
        slug: "",
        analysis: {},
        isArchived: !1,
        isPrimitive: !1,
        isAnalysis: t,
        components: [],
        componentTotalAmount: 0
    }
}
function Re(e) {
    const n = e.id > 0 ? e.id : e.originalId,
        t = void 0 !== e.collectionId ? Number(e.collectionId) : void 0,
        r = t && Number.isFinite(t) && t > 0 ? t : void 0;
    return {
        ...e,
        components: e.components?.map(e => ({
            ...e,
            material: {
                ...e.material
            }
        })),
        collectionId: r,
        id: Se(),
        _storeKey: void 0,
        originalId: n,
        revisionId: n,
        name: `${e.name} (Copy)`,
        isArchived: !1,
        privacy: o.PRIVATE
    }
}
function Ce(e) {
    const n = e.id > 0 ? e.id : e.originalId,
        t = void 0 !== e.collectionId ? Number(e.collectionId) : void 0,
        r = t && Number.isFinite(t) && t > 0 ? t : void 0;
    return e.isPrimitive || e.isAnalysis ? {
        ...Me({
            name: `Target: ${e.name}`
        }),
        privacy: o.PRIVATE,
        analysis: e.analysis ? {
            ...e.analysis
        } : {},
        umf: e.umf ? {
            ...e.umf
        } : {},
        collectionId: r,
        originalId: n,
        revisionId: n
    } : Re(e)
}
function Ee(e, n) {
    const t = ze(),
        r = e.id > 0 ? e.id : e.originalId;
    return {
        ...t,
        id: Se(),
        name: n ?? `${e.name ?? ""}`,
        isAnalysis: !0,
        isPrimitive: !1,
        isArchived: !1,
        privacy: o.PRIVATE,
        analysis: e.analysis ? {
            ...e.analysis
        } : {},
        umf: e.umf ? {
            ...e.umf
        } : {},
        originalId: r,
        revisionId: r
    }
}
function Te(e) {
    return {
        ...e,
        components: e.components?.map(e => ({
            ...e,
            material: e.material ? {
                ...e.material,
                analysis: {
                    ...e.material.analysis
                }
            } : void 0
        }))
    }
}
function Fe(e) {
    if (!e || 0 === e.length)
        return {
            analysis: void 0,
            umf: void 0
        };
    const n = {},
        t = e.reduce((e, n) => e + n.amount, 0);
    if (0 === t)
        return {
            analysis: {},
            umf: {}
        };
    e.forEach(e => {
        const r = e.material,
            {amount: a} = e,
            i = r?.analysis;
        i && (Object.entries(i).forEach(([e, r]) => {
            if (null != r && S(e)) {
                const i = M(n, e) + r * a / t;
                n[e] = i
            }
        }), i.loi && (n.loi = (n.loi || 0) + i.loi * a / t))
    });
    const r = de(n);
    return n.thermalExpansion = ge(r), n.thermalExpansionMol = he(r), {
        analysis: n,
        umf: q(n)
    }
}
function Be(e, n) {
    return Boolean(e.isAdd) !== Boolean(n.isAdd) ? e.isAdd ? 1 : -1 : n.amount - e.amount
}
function xe(e, n, t=0, r=!1, a=!1) {
    if (!n)
        return e;
    const i = e.components ?? [],
        s = {
            id: Se(),
            material: {
                ...n
            },
            amount: t,
            isAdd: r
        };
    let o;
    if (a)
        o = [...i, s].sort(Be);
    else if (r)
        o = [...i, s];
    else {
        const e = i.findIndex(e => e.isAdd);
        o = -1 === e ? [...i, s] : [...i.slice(0, e), s, ...i.slice(e)]
    }
    const {analysis: O, umf: u} = Fe(o);
    return {
        ...e,
        components: o,
        analysis: O,
        umf: u
    }
}
function Pe(e, n, t, r, a=!1, i=!1) {
    const s = e.components;
    if (!s || n < 0 || n >= s.length)
        return e;
    const o = s[n];
    if (o.material === t && o.amount === r && o.isAdd === a)
        return e;
    const O = s.map((e, i) => i === n ? {
            ...e,
            material: t,
            amount: r,
            isAdd: a
        } : e),
        u = o.isAdd !== a && (o.isAdd && n < O.findIndex(e => !e.isAdd) || !o.isAdd && n > O.findIndex(e => e.isAdd));
    let c = O;
    i ? c = [...O].sort(Be) : u && (c = [...O].sort((e, n) => e.isAdd === n.isAdd ? 0 : e.isAdd ? 1 : -1));
    const {analysis: l, umf: d} = Fe(c);
    return {
        ...e,
        components: c,
        analysis: l,
        umf: d
    }
}
function je(e, n, t=!1) {
    const r = e.components;
    if (!r || n < 0 || n >= r.length)
        return e;
    const a = r.filter((e, t) => t !== n),
        i = t ? a.sort(Be) : a,
        {analysis: s, umf: o} = Fe(i);
    return {
        ...e,
        components: i,
        analysis: s,
        umf: o
    }
}
function we(e, n=[], t=!1) {
    const r = t ? [...n].sort(Be) : n,
        {analysis: a, umf: i} = Fe(r);
    return {
        ...e,
        components: r,
        analysis: a,
        umf: i
    }
}
function Ie(e=[], n, {keepAdditives: t=!1}={}) {
    const r = e.reduce((e, t) => e + ("base" === n && t.isAdd ? 0 : t.amount), 0);
    return !Number.isFinite(r) || r <= 0 || e.some(e => !Number.isFinite(e.amount) || e.amount < 0) ? e : e.map(e => t && e.isAdd ? e : {
        ...e,
        amount: e.amount / r * 100
    })
}
function Ke(e) {
    const n = Ie(e.components, "total");
    const {analysis: t, umf: r} = Fe(n);
    return {
        ...e,
        components: n,
        analysis: t,
        umf: r
    }
}
function ke(e) {
    const n = Ie(e.components, "base");
    const {analysis: t, umf: r} = Fe(n);
    return {
        ...e,
        components: n,
        analysis: t,
        umf: r
    }
}
function Le(e) {
    const n = Ie(e.components, "base", {
            keepAdditives: !0
        }),
        {analysis: t, umf: r} = Fe(n);
    return {
        ...e,
        components: n,
        analysis: t,
        umf: r
    }
}
function Ue(e, n, {keepAdditives: t=!1}={}) {
    if (!e.components || 0 === e.components.length)
        return e;
    const r = e => e.amount > 0 && !(t && e.isAdd),
        a = e.components.reduce((e, n) => {
            const t = n.amount;
            if (r(n)) {
                const n = function(e) {
                    if (Math.floor(e) === e)
                        return 0;
                    const n = e.toString();
                    if (n.includes("e-")) {
                        const [e, t] = n.split("e-"),
                            r = parseInt(t, 10),
                            a = e.split(".")[1];
                        return (a ? a.length : 0) + r
                    }
                    if (n.includes("."))
                        return n.split(".")[1].length;
                    return 0
                }(t);
                return n > e ? n : e
            }
            return e
        }, 0),
        i = n ?? a - 1;
    if (i >= 0 && a > i) {
        const n = e.components.map(e => {
                const n = e.amount;
                if (r(e)) {
                    const t = function(e, n) {
                        const t = Math.pow(10, n);
                        return Math.round(e * t) / t
                    }(n, i);
                    return {
                        ...e,
                        amount: t
                    }
                }
                return e
            }),
            {analysis: t, umf: a} = Fe(n);
        return {
            ...e,
            components: n,
            analysis: t,
            umf: a
        }
    }
    return e
}
function Ze(e) {
    return e.components ? e.components.filter(e => !e.isAdd).reduce((e, n) => e + (n.amount || 0), 0) : 0
}
function De(e) {
    return e.components ? e.components.reduce((e, n) => e + (n.amount || 0), 0) : 0
}
function ze() {
    return {
        id: Se(),
        name: "",
        slug: "",
        isArchived: !1,
        isAnalysis: !1,
        isPrimitive: !1,
        materialStateId: 4,
        components: []
    }
}
function He() {
    return {
        id: Se(),
        name: "",
        slug: "",
        isArchived: !1,
        isAnalysis: !1,
        isPrimitive: !0,
        materialStateId: 4
    }
}
function _e(e, n=!1, t=!1) {
    if (!e)
        return ze();
    const r = Ge(e, n).reduce((e, t) => {
            if (!t.material?.id)
                return e;
            const r = e.find(e => e.material?.id === t.material?.id && (!n || !!e.isAdd == !!t.isAdd));
            return r ? r.amount += t.amount : e.push({
                id: t.id,
                material: {
                    ...t.material,
                    id: t.material.id
                },
                amount: t.amount,
                isAdd: !!n && !!t.isAdd
            }), e
        }, []).filter(e => e.amount > 0 && e.material),
        a = t ? Ye(r) : [...r.filter(e => !e.isAdd), ...r.filter(e => e.isAdd)],
        i = {
            ...e,
            id: e.id,
            components: a
        };
    return n ? ke(i) : Ke(i)
}
function Ge(e, n=!1) {
    return e?.components?.length ? e.components.flatMap(e => {
        if (!e.material)
            return [];
        const {material: t, amount: r, isAdd: a} = e;
        if (!Number.isFinite(r) || r < 0)
            throw new RangeError("Blend ingredient amounts must be finite and non-negative.");
        if (0 === r)
            return [];
        if (!t.components?.length) {
            if (!1 === t.isPrimitive && !t.isAnalysis)
                throw new RangeError("A blend recipe must have ingredients.");
            return [{
                id: t.id ?? Se(),
                material: t,
                amount: r,
                isAdd: !!n && !!a
            }]
        }
        const i = Ge(t, n),
            s = i.reduce((e, t) => e + (n && !a && t.isAdd ? 0 : t.amount), 0);
        if (!Number.isFinite(s) || s <= 0)
            throw new RangeError("A blend source must have a positive recipe total.");
        return i.map(e => ({
            id: e.id,
            material: e.material,
            amount: e.amount / s * r,
            isAdd: !!n && (!!a || !!e.isAdd)
        }))
    }) : []
}
function Ye(e=[]) {
    return [...e].sort(Be)
}
var Ve = new class {
    cache = new Map;
    groupCache = new Map;
    getCacheKey(e, n)
    {
        return `${JSON.stringify(e)}::${n ? JSON.stringify(n) : "default"}`
    }
    calculateUMF(e, n)
    {
        if (!e)
            return;
        const t = this.getCacheKey(e, n),
            r = this.cache.get(t);
        if (r)
            return r;
        const a = q(e, void 0, n || x.oxides);
        if (a && (this.cache.set(t, a), this.cache.size > 1e3)) {
            const e = this.cache.keys().next().value;
            void 0 !== e && this.cache.delete(e)
        }
        return a
    }
    groupOxides(e, n)
    {
        const t = `${JSON.stringify(e)}::${n ? JSON.stringify(n) : "default"}`,
            r = this.groupCache.get(t);
        if (r)
            return r;
        const a = fe(e, void 0, n);
        if (this.groupCache.set(t, a), this.groupCache.size > 500) {
            const e = this.groupCache.keys().next().value;
            void 0 !== e && this.groupCache.delete(e)
        }
        return a
    }
    clearCache()
    {
        this.cache.clear(),
        this.groupCache.clear()
    }
    isValidForChart(e)
    {
        return Ae(e)
    }
}
;
function $e(e, n) {
    return Ve.calculateUMF(e, n)
}
function We(e, n) {
    return Ve.groupOxides(e, n)
}
var Je = ["R2O", "RO", "R2O3", "RO2", "other"],
    Xe = {
        R2O: "R₂O",
        RO: "RO",
        R2O3: "R₂O₃",
        RO2: "RO₂"
    },
    Qe = Object.keys(g).filter(e => Boolean(m[e]));
function qe(e) {
    return Boolean(m[e] && g[e])
}
function en(e, n=F) {
    if (e === m.B2O3)
        switch (j(n.boronBehavior ?? "separate")) {
        case "r2o":
            return "R2O";
        case "ro":
            return "RO";
        case "r2o3":
            return "R2O3";
        case "ro2":
            return "RO2";
        default:
            return "B2O3"
        }
    return n.r2o?.includes(e) ? "R2O" : n.ro?.includes(e) ? "RO" : n.r2o3?.includes(e) ? "R2O3" : n.ro2?.includes(e) ? "RO2" : "other"
}
function nn(e, n) {
    return `oxide-colors-${en(e, n)}`
}
function tn(e) {
    const n = new Set;
    for (const t of e)
        qe(t) && n.add(t);
    return Qe.filter(e => n.has(e))
}
function rn(e, n="positive") {
    return e ? tn(Object.entries(e).filter(([e, t]) => qe(e) && function(e, n) {
        return "finiteNonZero" === n ? "number" == typeof e && Number.isFinite(e) && 0 !== e : (e ?? 0) > 0
    }(t, n)).map(([e]) => e)) : []
}
function an(e) {
    const n = new Set;
    for (const t of e)
        for (const e of rn(t))
            n.add(e);
    return tn(n)
}
function sn(e, n) {
    const t = tn(e);
    return Je.map(e => ({
        group: e,
        oxides: t.filter(t => function(e, n) {
            const t = en(e, n);
            return "B2O3" === t ? "R2O3" : t
        }(t, n) === e)
    })).filter(({oxides: e}) => e.length > 0)
}

export {$e as glazyUMF,x as traditionalBasis};