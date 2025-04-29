import ISelectionId = powerbi.visuals.ISelectionId;
import * as d3 from "d3";

export interface BoxPlotData {
    area: string;
    min: number;
    max: number;
    q1: number;
    median: number;
    mean?: number;
    q3: number;
    iqr: number;
    lower_bound: number;
    upper_bound: number;
    values: number[];
    outliers_inf: number[];
    outliers_sup: number[];
    selectionId?: ISelectionId,
    color?: string;
    originalArea: string;
}

const CONOSCENZE = "CONOSCENZE"
const CONOSCENZE_tr = "CONOSCENZE"
const CARICO_DI_STUDIO = "CARICO DI STUDIO"
const CARICO_DI_STUDIO_tr = "CARICO DI STUDIO"
const MATERIALE_DIDATTICO = "MATERIALE DIDATTICO"
const MATERIALE_DIDATTICO_tr = "MATERIALE DIDATTICO"
const MOD_ESAME = "MOD ESAME"
const MOD_ESAME_tr = "MODALITA' ESAME"
const SODDISFAZIONE = "SODDISFAZIONE"
const SODDISFAZIONE_tr = "SODDISFAZIONE"
const ORARI = "ORARI"
const ORARI_tr = "ORARI"
const DOC_STIMOLA = "DOC STIMOLA"
const DOC_STIMOLA_tr = "DOCENTE STIMOLA"
const DOC_ESPONE = "DOC ESPONE"
const DOC_ESPONE_tr = "DOCENTE ESPONE"
const ATT_INTEGRATIVE = "ATT. INTEGRATIVE"
const ATT_INTEGRATIVE_tr = "ATTIVITA' INTEGRATIVE"
const COERENZA = "COERENZA"
const COERENZA_tr = "COERENZA"
const DOC_REPERIBILE = "DOC REPERIBILE"
const DOC_REPERIBILE_tr = "DOCENTE REPERIBILE"
const INTERESSE = "INTERESSE"
const INTERESSE_tr = "INTERESSE"


export function getOriginalAreaFrom(area) {
    if(area == CONOSCENZE_tr){
        return CONOSCENZE
    }
    
    if(area == CARICO_DI_STUDIO_tr){
        return CARICO_DI_STUDIO
    }
    if(area == MATERIALE_DIDATTICO_tr){
        return MATERIALE_DIDATTICO
    }
    if(area == MOD_ESAME_tr){
        return MOD_ESAME
    }
    if(area == SODDISFAZIONE_tr){
        return SODDISFAZIONE
    }
    if(area == ORARI_tr){
        return ORARI
    }
    if(area == DOC_STIMOLA_tr){
        return DOC_STIMOLA
    }
    if(area == DOC_ESPONE_tr){
        return DOC_ESPONE
    }
    if(area == ATT_INTEGRATIVE_tr){
        return ATT_INTEGRATIVE
    }
    if(area == COERENZA_tr){
        return COERENZA
    }
    if(area == DOC_REPERIBILE_tr){
        return DOC_REPERIBILE
    }
    if(area == INTERESSE_tr){
        return INTERESSE
    }
    return area
}

export function getTransformAreaFrom(area) {
    if (area == CONOSCENZE) {
        return CONOSCENZE_tr
    }
    if (area == CARICO_DI_STUDIO) {
        return CARICO_DI_STUDIO_tr
    }
    if (area == MATERIALE_DIDATTICO) {
        return MATERIALE_DIDATTICO_tr
    }
    if (area == MOD_ESAME) {
        return MOD_ESAME_tr
    }
    if (area == SODDISFAZIONE) {
        return SODDISFAZIONE_tr
    }
    if (area == ORARI) {
        return ORARI_tr
    }
    if (area == DOC_STIMOLA) {
        return DOC_STIMOLA_tr
    }
    if (area == DOC_ESPONE) {
        return DOC_ESPONE_tr
    }
    if (area == ATT_INTEGRATIVE) {
        return ATT_INTEGRATIVE_tr
    }
    if (area == COERENZA) {
        return COERENZA_tr
    }
    if (area == DOC_REPERIBILE) {
        return DOC_REPERIBILE_tr
    }
    if (area == INTERESSE) {
        return INTERESSE_tr
    }
    return area

}

export function calculateBoxPlotData(values: number[], area: string, selectionId?: ISelectionId, color?: string): BoxPlotData {
    const min = percentile(values, 0.00);
    const q1 = percentile(values, 0.25);
    const median = percentile(values, 0.50);
    const mean = d3.mean(values);
    const q3 = percentile(values, 0.75);
    const max = percentile(values, 1.00);
    const iqr = q3 - q1;
    // Supponendo che i dati siano in percentuali!
    const lower_bound = Math.max(q1 - 1.5 * iqr, 0)
    const upper_bound = Math.min(q3 + 1.5 * iqr, 100)
    let outliers_inf = [], outliers_sup = [];
    for (var val of values) {
        if (val < lower_bound) {
            outliers_inf.push(val);
        } else if (val > upper_bound) {
            outliers_sup.push(val);
        }
    }

    return {
        area: getTransformAreaFrom(area),
        min,
        max,
        q1,
        median,
        mean,
        q3,
        iqr,
        lower_bound,
        upper_bound,
        values,
        outliers_inf,
        outliers_sup,
        selectionId,
        color: color,
        originalArea: area
    };
}
export var percentile = (arr, val) => d3.quantile(arr, val);