/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettings } from "./settings";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import FormattingModel = powerbi.visuals.FormattingModel;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import { BoxPlotData, calculateBoxPlotData, percentile } from "./boxplotdata"
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import * as d3 from "d3";
import { image } from "./unige_image";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectPropertyIdentifier = powerbi.DataViewObjectPropertyIdentifier;
import Fill = powerbi.Fill;
import { ThresholdLines } from "./thresholdLines";

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: Selection<HTMLElement>;
    private svg: Selection<SVGElement>;
    private width: number;
    private height: number;
    private margin = { top: 30, right: 100, bottom: 50 + 120, left: 30, xAxistop: 15 };
    private options: VisualUpdateOptions;
    private selectionManager: ISelectionManager;
    //private tooltipServiceWrapper: ITooltipServiceWrapper;
    private boxPlotData: BoxPlotData[] = [];
    private boxPlotData_dip: BoxPlotData[] = [];
    private boxPlotData_cds: BoxPlotData[] = [];
    private questionariBianchi: number = 0;
    private questionariCompilati: number = 0;
    private colors = {
        "CONOSCENZE": "#008fd3",
        "CARICO DI STUDIO": "#99d101",
        "MATERIALE DIDATTICO": "#f39b02",
        "MOD ESAME": "#9fcfec",
        "SODDISFAZIONE": "#4ba707",
        "ORARI": "#f6d133",
        "DOC STIMOLA": "#cb4d2c",
        "DOC ESPONE": "#cac7ba",
        "ATT. INTEGRATIVE": "#0d869c",
        "COERENZA": "#cdd72e",
        "DOC REPERIBILE": "#247230",
        "INTERESSE": "#6cdedc"
    }
    private asseX: d3.ScaleBand<string>;
    private asseY: d3.ScaleLinear<number, number, never>;
    private visualSettings: VisualSettings;
    private formattingSettingsService: FormattingSettingsService;
    private thresholdLines: ThresholdLines[] = [];
    private buttonContainer: d3.Selection<HTMLDivElement, any, any, any>;
    private btn_solo_cds: d3.Selection<HTMLButtonElement, any, any, any>;
    private btn_solo_dip: d3.Selection<HTMLButtonElement, any, any, any>;
    private btn_all: d3.Selection<HTMLButtonElement, any, any, any>;
    private filter_all: boolean = true;
    private filter_dip: boolean = false;
    private filter_cds: boolean = false;
    private numberOfIns: number = 0;
    private dataView: DataView;
    private data: BoxPlotData[];

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        console.log("Visual build options", options)
        console.log("Salvato", this.options)
        this.root = d3.select(options.element);
        let style = document.createElement("style");
        style.type = "text/css";
        style.innerHTML = `
            @font-face {
                font-family: 'Fira Sans';
                src: url('./style/fonts/Fira_Sans/FiraSans-Regular.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            .custom-font {
                font-family: 'Fira Sans', sans-serif;
            }
        `;
        this.root.append("style").text(`
            @font-face {
                font-family: 'Fira Sans';
                src: url('./style/fonts/Fira_Sans/FiraSans-Regular.ttf') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
            .custom-font {
                font-family: 'Fira Sans', sans-serif;
            }
        `);
        this.buttonContainer = this.root.append("div");
        this.svg = d3.select(options.element).append('svg');
        this.selectionManager = this.host.createSelectionManager();
        this.handleContextMenu();
        //this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
    }

    public createTextbox() {
        let div = this.buttonContainer
            .append("div")
            .style("display", "flex")
            .style("flex-direction", "row")
        div.append("div")
            .style("flex-grow", 1)
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("display", "flex")
            .style("flex-direction", "column")
            .html(`<span style="text-align: center"><h1 style="margin: 10px 0px;">${this.numberOfIns}</h1>Numero insegnamenti valutati</span>`)
        div.append("div")
            .style("flex-grow", 1)
            .style("justify-content", "center")
            .style("align-items", "center")
            .style("display", "flex")
            .style("flex-direction", "column")
            .html(`<span style="text-align: center"><h1 style="margin: 10px 0px;">${this.questionariCompilati}</h1>Questionari compilati</span>`)
        if (this.visualSettings.stile.show_questionari_bianchi.value == true) {
            div.append("div")
                .style("flex-grow", 1)
                .style("justify-content", "center")
                .style("align-items", "center")
                .style("display", "flex")
                .style("flex-direction", "column")
                .html(`<span style="text-align: center"><h1 style="margin: 10px 0px;">${this.questionariBianchi}</h1>Questionari bianchi</span>`)
        }
    }

    private createButtons() {
        const min_dist = 5;
        this.buttonContainer.selectAll("*").remove();
        let div = this.buttonContainer
            .append("div")
            .style("margin-left", "40px")
        this.btn_all = div
            .append("button")
            .attr("clicked", this.filter_all)
            .attr("id", "btn_tutti")
            .text("Tutto")
            .style("position", "relative")
            .style("padding", "4px 10px")
            //.style("left","40px")
            .on("click", event => {
                var elem = document.getElementById("btn_tutti");
                if (elem.getAttribute("clicked") == "false") {
                    elem.setAttribute("clicked", "true")
                    console.log("Solo filter_all a true")
                    this.filter_all = true
                    this.filter_cds = false
                    this.filter_dip = false
                } else {
                    elem.setAttribute("clicked", "false")
                    this.filter_all = false
                    console.log("Solo filter_all a false")
                }
                this.update(this.options)
            })
        let offsets_all = document.getElementById("btn_tutti").getClientRects()[0];
        this.btn_solo_cds = div
            .append("button")
            .attr("clicked", this.filter_cds)
            .attr("id", "btn_solo_cds")
            .text("Filtro privacy su CDS")
            .style("position", "relative")
            .style("padding", "4px 10px")
            .style("left", min_dist + "px")
            .on("click", event => {
                var elem = document.getElementById("btn_solo_cds");
                if (elem.getAttribute("clicked") == "false") {
                    elem.setAttribute("clicked", "true")
                    console.log("solo filter_cds a true")
                    this.filter_all = false
                    this.filter_cds = true
                    this.filter_dip = false
                } else {
                    elem.setAttribute("clicked", "false")
                    this.filter_cds = false
                    console.log("solo filter_cds a false")
                }
                this.update(this.options)
            })
        let offsets_cds = document.getElementById("btn_solo_cds").getClientRects()[0];
        this.btn_solo_dip = div
            .append("button")
            .attr("clicked", this.filter_dip)
            .attr("id", "btn_solo_dip")
            .text("Filtro privacy su DIP")
            .style("background-color", this.filter_dip ? "darkgray" : "")
            .style("position", "relative")
            .style("padding", "4px 10px")
            .style("left", min_dist * 2 + "px")
            .on("click", event => {
                var elem = document.getElementById("btn_solo_dip");
                if (elem.getAttribute("clicked") == "false") {
                    elem.setAttribute("clicked", "true")
                    console.log("solo filter_dip a true")
                    this.filter_all = false
                    this.filter_cds = false
                    this.filter_dip = true
                } else {
                    elem.setAttribute("clicked", "false")
                    this.filter_dip = false
                    console.log("solo filter_dip a false")
                }
                this.update(this.options)
            })
        if (this.filter_all) {
            this.btn_all.style("background-color", "#199BFC").style("color", "white").style("font-weight", "bold")
        }
        if (this.filter_cds) {
            this.btn_solo_cds.style("background-color", "#199BFC").style("color", "white").style("font-weight", "bold")
        }
        if (this.filter_dip) {
            this.btn_solo_dip.style("background-color", "#199BFC").style("color", "white").style("font-weight", "bold")
        }
        if (this.visualSettings.stile.show_buttons.value == false) {
            this.btn_all.style("display", "none")
            this.btn_solo_cds.style("display", "none")
            this.btn_solo_dip.style("display", "none")
        }
    }

    private handleContextMenu() {
        this.svg.on('contextmenu', (event: PointerEvent, dataPoint) => {
            console.log("ciao")
            this.selectionManager.showContextMenu(dataPoint ? dataPoint : {}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    public getTextDimension(text: string, font?: any) {
        // Crea un elemento span temporaneo
        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "nowrap"; // Impedisce il testo a capo
        if (font !== undefined) {
            span.style.font = font; // Imposta lo stile del font come l'elemento originale
        }
        span.innerText = text;

        // Aggiungi lo span al documento per misurarne la larghezza
        document.body.appendChild(span);
        const width = span.offsetWidth;
        const height = span.offsetHeight

        // Rimuovi lo span dal DOM
        document.body.removeChild(span);

        return [width, height];
    }

    public displayTooltip(event, d) {
        var secondColumnWidth = d3.max([this.getTextDimension(d.area, undefined)[0] + 5, 110]);
        this.root.append("div")
            .attr("id", "tooltip")
            .style("background-color", "white")
            .style("position", "absolute")
            .style("border", "1px solid black")
            .style("border-radius", "10px")
            .style("top", event.clientY + 10 + "px")
            .style("left", event.clientX + 20 + "px")
            .append("div")
            .style("display", "grid")
            .style("grid-template-columns", `140px ${secondColumnWidth}px`)
            .style("padding", "10px")
            .html(`
                <span style="text-align: end;margin-right: 8px;">AREA: </span><span>${d.area}</span>
                <span style="text-align: end;margin-right: 8px;">Media: </span><span>${d.mean.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Mediana: </span><span>${d.median.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Q1: </span><span>${d.q1.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Q3: </span><span>${d.q3.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Lower Bound: </span><span>${d.lower_bound.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Upper Bound: </span><span>${d.upper_bound.toFixed(2) + " %"}</span>
                <span style="text-align: end;margin-right: 8px;">Outliers inferiori: </span><span>${d.outliers_inf.length}</span>
                <span style="text-align: end;margin-right: 8px;">Outliers superiori: </span><span>${d.outliers_sup.length}</span>
            `)
        const tooltip = document.getElementById("tooltip")
        const clientrects = tooltip.getClientRects()[0]
        if (clientrects.x + clientrects.width > document.documentElement.getClientRects()[0].width) {
            console.log("Siamo dentro")
            this.root.select("#tooltip").style("left", event.clientX - 20 - clientrects.width + "px")
        }
    }

    public getDataFromDataview(dataView: DataView) {
        this.boxPlotData = [];
        this.boxPlotData_dip = [];
        this.boxPlotData_cds = [];
        this.questionariBianchi = 0;
        this.questionariCompilati = 0;
        let flag_quest_bianchi = false, flag_quest_compilati = false;
        const areas = dataView.categorical.categories[0].values
        var indexArea = 0;
        for (var indexArea = 0; indexArea < areas.length; indexArea++) {
            const area = <string>areas[indexArea];
            let color = this.getColorFromObject(area, dataView, indexArea);
            const categorySelectionId = this.host.createSelectionIdBuilder()
                .withCategory(dataView.categorical.categories[0], indexArea) // Una sola categoria ("Area Domanda")
                .createSelectionId();
            let datas = dataView.categorical.values.grouped();
            if (datas.length > 1) {
                if (datas[0].values.length > 1 && !flag_quest_bianchi) {
                    this.questionariBianchi = <number>datas.map(data => data.values[1]).map(data => data.values[0])[0]
                    flag_quest_bianchi = true
                }
                if (datas[0].values.length > 2 && !flag_quest_compilati) {
                    this.questionariCompilati = <number>datas.map(data => data.values[2]).map(data => data.values[0])[0]
                    flag_quest_compilati = true
                }
            }
            let datas1 = dataView.categorical.values.filter(i => i.source.queryName.indexOf("giudizi positivi") >= 0)
            const values_all = <number[]>datas1.map(child => <number>child.values[indexArea] * 100);
            const data_all = calculateBoxPlotData(values_all, area, categorySelectionId, color);
            this.boxPlotData.push(data_all);
            const values_dip = <number[]>datas1.filter(child => (<string>child.source.groupName).split("_")[0] == "SI").map(child => <number>child.values[indexArea] * 100);
            const data_dip = calculateBoxPlotData(values_dip, area, categorySelectionId, color);
            this.boxPlotData_dip.push(data_dip)
            const values_cds = <number[]>datas1.filter(child => (<string>child.source.groupName).split("_")[1] == "SI").map(child => <number>child.values[indexArea] * 100);
            const data_cds = calculateBoxPlotData(values_cds, area, categorySelectionId, color);
            this.boxPlotData_cds.push(data_cds)
        }
    }

    public getColorFromObject(area: string, dataView: powerbi.DataView, indexArea: number) {
        const defaultColor: Fill = {
            solid: {
                color: this.colors[area],
            }
        };
        const prop: DataViewObjectPropertyIdentifier = {
            objectName: "colorSelector",
            propertyName: "fill"
        };

        let colorFromObjects: Fill;
        if (dataView.categorical.categories[0].objects?.[indexArea]) {
            colorFromObjects = dataViewObjects.getValue(dataView.categorical.categories[0]?.objects[indexArea], prop);
        }

        let color = colorFromObjects?.solid.color ?? defaultColor.solid.color;
        return color;
    }

    public creaAssi(data: BoxPlotData[]) {
        // Scala degli assi
        this.asseX = d3.scaleBand()
            .domain(data.map(d => d.area))
            .range([0, this.width])
            .padding(0.2);

        this.asseY = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([this.height, 0]);

        // Crea l'elemento SVG
        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right + (this.visualSettings.stile.showLogo.value == true? 30 : 0) + (this.visualSettings.stile.show_right_yaxis ? 30 : 0))
            .attr("height", this.height + this.margin.top + this.margin.bottom)


        /*let gtext = this.svg.append("g")
            .attr("transform", `translate(${this.asseX.bandwidth() / 2},10)`)
        gtext.append("text")
            .text("NUMERO DI INSEGNAMENTI VALUTATI: " + this.numberOfIns.length)
            .attr("dy", ".35em")
            .style("font-size", "10")
            .call(this.wrap, this.asseX.bandwidth() * 10)*/

        let g = this.svg
            .append("g")
            .attr("id", "svg-container")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Aggiungi asse X
        g.append("g")
            .attr("id", "asseX")
            .attr("transform", `translate(0,${this.height + this.margin.xAxistop})`)
            .call(d3.axisBottom(this.asseX))
            .selectAll("line").remove();
        g.selectAll("text") // Seleziona tutte le etichette dell'asse X
            .style("text-anchor", "middle") // Centro il testo
            .attr("dy", ".35em")// Allineamento verticale del testo
            .call(this.wrap, this.asseX.bandwidth()); // Applica la funzione wrap per spezzare il testo

        // Aggiungi asse Y a sx
        g.append("g")
            .attr("id", "asseY_sx")
            .call(d3.axisLeft(this.asseY))
            //.selectAll("line").remove();
            .selectAll(".tick line").remove()
        g.selectAll("path").remove();
        //asseY = 0 a sx
        g.append("line")
            .attr("x1", this.asseX(data[0].area) - (this.visualSettings.stile.showLogo.value ? 18 : 19.5))
            .attr("x2", this.asseX(data[0].area) - (this.visualSettings.stile.showLogo.value ? 18 : 19.5))
            .attr("y1", 0 - 4)
            .attr("y2", this.height)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // asseX = 0
        g.append("line")
            .attr("x1", 0)
            .attr("x2", this.width) // larghezza totale
            .attr("y1", this.asseY(0)) // y=0 trasformato in coordinate SVG
            .attr("y2", this.asseY(0))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        if (this.visualSettings.stile.show_right_yaxis.value == true) {
            g.append("g")
                .attr("id", "asseY_dx")
                .attr("transform", `translate(${this.width},0)`)
                .call(d3.axisRight(this.asseY))
                //.selectAll("line").remove();
                .selectAll(".tick line").remove()

            //asseY = 0 a dx
            g.append("line")
                .attr("x1", this.asseX(data[data.length - 1].area) + this.asseX.bandwidth() + (this.visualSettings.stile.showLogo.value ? 18 : 19.5))
                .attr("x2", this.asseX(data[data.length - 1].area) + this.asseX.bandwidth() + (this.visualSettings.stile.showLogo.value ? 18 : 19.5))
                .attr("y1", 0 - 4)
                .attr("y2", this.height)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            g.selectAll("path").remove();
        }

    }

    public creaLegenda() {
        const rowHeight = 15
        const yOffset = 55
        var legenda = this.root.select("#svg-container")
            .append("g")
            .attr("id", "legenda")
            .attr("x", this.asseX(this.data[0].area))
            .attr("y", 0 - 30)
        for (var i = 0; i < this.visualSettings.stile.nOfThresholdLines.value; i++) {
            let d = this.visualSettings.thres.getThresholdLine(i + 1)
            const group = legenda.append("g")
                .attr("transform", `translate(0, ${i * rowHeight})`);
            // Linea simbolo
            group.append("line")
                .attr("x1", 0)
                .attr("x2", 30)
                .attr("y1", this.height+yOffset)
                .attr("y2", this.height+yOffset)
                .attr("stroke", d[0].value.value)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", 4);

            // Testo associato
            group.append("text")
                .attr("x", 40)
                .attr("y", this.height+yOffset)
                .attr("dy", "0.35em")
                .style("font-size", "10px")
                .style("font-family", "sans-serif")
                .text(d[2].value);
        }
    }

    public aggiungiThreshold(lineOfThreshold_attribs, attribs) {
        var line = this.root.select("#svg-container")
            .append("line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", this.asseY(lineOfThreshold_attribs[1].value))
            .attr("y2", this.asseY(lineOfThreshold_attribs[1].value))
            .attr("stroke", lineOfThreshold_attribs[0].value.value)
        for (var i of Object.keys(attribs)) {
            line.attr(i, attribs[i])
        }

        let text_dim = this.getTextDimension(lineOfThreshold_attribs[2].value)

        // Sfondo rettangolare dietro al testo
        let textbox = this.root.select("#svg-container")
            .append("rect") // inserisci PRIMA del <text>
            .attr("fill", lineOfThreshold_attribs[0].value.value)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("rx", 3) // angoli arrotondati (opzionale)
            .attr("ry", 3);
        // aggiungo il nome alla threshold line
        let text = this.root.select("#svg-container")
            .append("text")
            .attr("x", this.width - text_dim[0])
            .attr("y", this.asseY(lineOfThreshold_attribs[1].value) + text_dim[1])
            .attr("dy", "0.35em") // per allineare verticalmente al centro della linea
            .style("font-size", "12px")
            .style("fill", "black") // stesso colore della linea
            .text(lineOfThreshold_attribs[2].value); // cambia col tuo testo


        // Ottieni bounding box del testo
        const bbox = text.node().getBBox();

        textbox.attr("x", bbox.x - 4)
            .attr("y", bbox.y - 1)
            .attr("width", bbox.width + 8)
            .attr("height", bbox.height + 4)
    }

    public getFormattingModel(): FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.visualSettings);
    }

    public setMarginAndDims() {
        if (this.visualSettings.stile.showLogo.value == false) {
            this.margin.right = 0;
        } else {
            this.margin.right = 100;
        }
        this.width = this.options.viewport.width - this.margin.left - this.margin.right - ( this.visualSettings.stile.showLogo.value == true ? 20 : 0) - (this.visualSettings.stile.show_right_yaxis.value == true ? 30 : 0);
        this.height = this.options.viewport.height - this.margin.top - this.margin.bottom;
    }

    public createThresholdLines(dataView: DataView) {
        this.thresholdLines = [];
        for (var i = 0; i < this.visualSettings.stile.nOfThresholdLines.value; i++) {
            var tl = new ThresholdLines();
            const defaultColor: Fill = {
                solid: {
                    color: "#000000",
                }
            };
            const prop: DataViewObjectPropertyIdentifier = {
                objectName: "lineOptions",
                propertyName: "lineColor"
            };

            let colorFromObjects: Fill;
            if (dataView.categorical.categories[0].objects?.[i]) {
                colorFromObjects = dataViewObjects.getValue(dataView.categorical.categories[0]?.objects[i], prop);
            }
            let color = colorFromObjects?.solid.color ?? defaultColor.solid.color;
            tl.setColor(color);
            this.thresholdLines.push(tl);
        }
    }

    public update(options: VisualUpdateOptions) {
        //debugger;
        console.log("PRIMA", this.filter_all, this.filter_cds, this.filter_dip)
        if (!this.filter_all && !this.filter_cds && !this.filter_dip) {
            this.filter_all = true;
        }
        console.log("DOPO", this.filter_all, this.filter_cds, this.filter_dip)
        this.btn_all?.attr("clicked", this.filter_all)
        this.btn_solo_cds?.attr("clicked", this.filter_cds)
        this.btn_solo_dip?.attr("clicked", this.filter_dip)
        this.options = options
        this.visualSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettings, options.dataViews[0]);
        this.setMarginAndDims();

        // Pulisci tutti gli elementi
        this.svg.selectAll("*").remove()
        this.dataView = options.dataViews[0];

        this.getDataFromDataview(this.dataView);
        this.visualSettings.populateColorSelector(this.boxPlotData);
        //this.visualSettings.populateThresholdSelector(this.visualSettings.stile.nOfThresholdLines.value);
        if (this.visualSettings.stile.nOfThresholdLines.value > 0) {
            this.visualSettings.thres.visible = true;
            for (var i = 0; i < this.visualSettings.stile.nOfThresholdLines.value; i++) {
                //this.visualSettings.thres.slices[i * 3].visible = true; //colore della linea
                //this.visualSettings.thres.slices[i * 3 + 1].visible = true; //valore della linea
                //this.visualSettings.thres.slices[i * 3 + 2].visible = true; //Nome della linea
                this.visualSettings.thres.activate_line(i + 1)
            }
        }
        this.data = this.boxPlotData;
        if (this.filter_all) {
            this.data = this.boxPlotData;
        } else if (this.filter_cds) {
            this.data = this.boxPlotData_cds;
        } else if (this.filter_dip) {
            this.data = this.boxPlotData_dip;
        }
        this.numberOfIns = this.data[0].values.length

        // Crea bottoni di scelta
        this.createButtons();

        // Crea textbox per questionari
        this.createTextbox();

        // Creazione degli assi
        this.creaAssi(this.data)

        // Disegna il boxplot per ciascuna area delle domande
        const activeSelections = this.selectionManager.getSelectionIds();
        this.data.forEach(d => {
            //console.log(d)
            let g1 = this.root.select("#svg-container").append("g");
            g1.attr("class", d.area)
            g1.on("click", (event) => {
                console.log("Cliccato!")
                this.selectionManager.select(d.selectionId);
                this.update(options);
                if (activeSelections.length == 0) {
                    this.displayTooltip(event, d);
                    return;
                }
                let selectionDifferent = false;
                for (var i of activeSelections) {
                    for (var j of this.selectionManager.getSelectionIds()) {
                        if (i["key"] != j["key"]) {
                            selectionDifferent = true
                            break;
                        }
                    }
                }
                if (selectionDifferent) {
                    this.root.select("#tooltip").remove()
                    this.displayTooltip(event, d);
                }
            })
            var selected = false;
            for (var i of activeSelections) {
                if (i["key"] == d.selectionId.getKey()) {
                    selected = true
                }
            }
            //debugger;
            //if(categorySelectionId.key == this.selectionManager.getSelectionIds()[0].key)

            // Linea verticale del boxplot (dal lower bound al upper bound)
            g1.append("line")
                .attr("x1", this.asseX(d.area)! + this.asseX.bandwidth() / 2)
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth() / 2)
                .attr("y1", Math.min(d.lower_bound, d.min) == d.lower_bound ? this.asseY(d.min) : this.asseY(d.lower_bound))
                .attr("y2", Math.max(d.upper_bound, d.max) == d.upper_bound ? this.asseY(d.max) : this.asseY(d.upper_bound))
                .attr("stroke", "black");

            // Box dal Q1 al Q3
            g1.append("rect")
                .attr("x", this.asseX(d.area) + this.visualSettings.stile.boxSize.value / 2)
                .attr("y", this.asseY(d.q3))
                .attr("height", this.asseY(d.q1) - this.asseY(d.q3))
                .attr("width", this.asseX.bandwidth() - this.visualSettings.stile.boxSize.value)
                .attr("stroke", "black")
                .attr("fill", d.color);

            // Linea della mediana
            g1.append("line")
                .attr("x1", this.asseX(d.area) + this.visualSettings.stile.boxSize.value / 2)
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth() - this.visualSettings.stile.boxSize.value / 2)
                .attr("y1", this.asseY(d.median) + this.visualSettings.stile.boxSize.value / 2)
                .attr("y2", this.asseY(d.median) + this.visualSettings.stile.boxSize.value / 2)
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // Linea per i bound (upper_bound e lower_bound)
            g1.append("line")
                .attr("x1", this.asseX(d.area) + this.visualSettings.stile.boxSize.value / 2)
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth() - this.visualSettings.stile.boxSize.value / 2)
                .attr("y1", Math.min(d.lower_bound, d.min) == d.lower_bound ? this.asseY(d.min) : this.asseY(d.lower_bound))
                .attr("y2", Math.min(d.lower_bound, d.min) == d.lower_bound ? this.asseY(d.min) : this.asseY(d.lower_bound))
                .attr("stroke", "black");

            g1.append("line")
                .attr("x1", this.asseX(d.area) + this.visualSettings.stile.boxSize.value / 2)
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth() - this.visualSettings.stile.boxSize.value / 2)
                .attr("y1", Math.max(d.upper_bound, d.max) == d.upper_bound ? this.asseY(d.max) : this.asseY(d.upper_bound))
                .attr("y2", Math.max(d.upper_bound, d.max) == d.upper_bound ? this.asseY(d.max) : this.asseY(d.upper_bound))
                .attr("stroke", "black");

            // Outliers
            for (var val of d.values) {
                if (val < d.lower_bound || val > d.upper_bound) {
                    g1.append("circle")
                        .style("fill", "white")
                        .style("fill-opacity", "0.5")
                        .style("stroke", "black")
                        .attr("r", this.visualSettings.stile.outliersRadius.value)
                        .attr("cx", this.asseX(d.area)! + this.asseX.bandwidth() / 2)
                        .attr("cy", this.asseY(val))
                }
            }
            if (activeSelections.length > 0) {
                if (!selected) {
                    g1.style("opacity", "0.2");
                } else if (selected || true) {
                    g1.on("mousemove", (event) => {
                        //debugger;
                        let tooltip = this.root.select("#tooltip")
                        if (tooltip.size() == 0) {
                            this.displayTooltip(event, d)
                        } else {
                            this.root.select("#tooltip").style("top", event.clientY + 10 + "px").style("left", event.clientX + 20 + "px")
                            const tooltip = document.getElementById("tooltip")
                            const clientrects = tooltip.getClientRects()[0]
                            if (clientrects.x + clientrects.width > document.documentElement.getClientRects()[0].width) {
                                this.root.select("#tooltip").style("left", event.clientX - 20 - clientrects.width + "px")
                            }
                            if (clientrects.y + clientrects.height > document.documentElement.getClientRects()[0].height) {
                                this.root.select("#tooltip").style("top", event.clientY - clientrects.height + "px")
                            }
                        }
                    })
                }
            } else {
                this.root.select("#tooltip").remove()
            }
        });

        // Threshold line 25% e 50%
        //this.aggiungiThreshold(25, { "stroke": "red", "stroke-dasharray": 4 })
        //this.aggiungiThreshold(50, { "stroke": "#cccc00", "stroke-dasharray": 4 })
        for (var i = 0; i < this.visualSettings.stile.nOfThresholdLines.value; i++) {
            this.aggiungiThreshold(this.visualSettings.thres.getThresholdLine(i + 1), { "stroke-dasharray": 4 });
        }
        this.creaLegenda()
        //this.createThresholdLines(this.dataView)


        if (this.visualSettings.stile.showLogo.value == true) {
            this.svg
                .append("image")
                .attr("xlink:href", "data:image/png;base64," + image)
                .attr("x", this.width - 70 + 30)  // Posizione X dell'immagine
                .attr("y", 0)  // Posizione Y dell'immagine
                .attr("width", this.visualSettings.stile.logoSize.value ? this.visualSettings.stile.logoSize.value : 300)  // Larghezza dell'immagine
                .attr("height", this.visualSettings.stile.logoSize.value ? this.visualSettings.stile.logoSize.value / 4 : 75);  // Altezza dell'immagine
        }
    }

    // Funzione per spezzare le etichette troppo lunghe
    private wrap(text, width) {
        text.each(function () {
            const text = d3.select(this);
            const words = text.text().split(/\s+/).reverse(); // Divide l'etichetta in parole
            const manyword = words.length;
            let word;
            let line: string[] = [];
            let lineNumber = 0;
            const lineHeight = 1.3; // Altezza della linea (em)
            const y = text.attr("y");
            const dy = parseFloat(text.attr("dy") || ".35em");
            let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");

            // Raggruppa le parole dentro il tspan
            while ((word = words.pop())) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node()!.getComputedTextLength() > width && manyword > 1) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
}