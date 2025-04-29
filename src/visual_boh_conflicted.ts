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
//import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { createTooltipServiceWrapper, ITooltipServiceWrapper } from "powerbi-visuals-utils-tooltiputils";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualSettings } from "./settings";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions
import VisualObjectInstance = powerbi.VisualObjectInstance
import FormattingGroup = powerbi.visuals.FormattingGroup;
import FormattingModel = powerbi.visuals.FormattingModel;
import FormattingCard = powerbi.visuals.FormattingCard;
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import Selector = powerbi.data.Selector;
import { BoxPlotData, calculateBoxPlotData, percentile } from "./boxplotdata"
import VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import * as d3 from "d3";
import { image } from "./unige_image";

//import { FormattingModel, FormattingGroup, FormattingCard } from "powerbi-visuals-utils-formattingmodel";


type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: Selection<HTMLElement>;
    private svg: Selection<SVGElement>;
    private container: Selection<SVGElement>;
    private width: number;
    private height: number;
    private margin = { top: 30, right: 100, bottom: 50, left: 30, xAxistop: 15 };
    private options: VisualUpdateOptions;
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper;
    private boxPlotData: BoxPlotData[] = [];
    private colors = ["#008fd3", "#99d101", "#f39b02", "#9fcfec", "#4ba707", "#f6d133", "#cb4d2c", "#cac7ba", "#0d869c", "#cdd72e", "#247230", "#6cdedc"];
    private asseX: d3.ScaleBand<string>;
    private asseY: d3.ScaleLinear<number, number, never>;
    private numberOfIns: powerbi.PrimitiveValue[];
    private visualSettings: VisualSettings;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        console.log("Visual build options", options)
        console.log("Salvato", this.options)
        this.root = d3.select(options.element);
        this.svg = d3.select(options.element).append('svg')
        this.selectionManager = this.host.createSelectionManager();
        this.handleContextMenu();
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
    }

    private handleContextMenu() {
        this.svg.on('contextmenu', (event: PointerEvent, dataPoint) => {
            this.selectionManager.showContextMenu(dataPoint ? dataPoint : {}, {
                x: event.clientX,
                y: event.clientY
            });
            event.preventDefault();
        });
    }

    public calculations(dataView: DataView) {
        var result = ""
        for (var area of dataView.matrix.rows.root.children) {
            result += area.value + " : ";
            result += "\nMin=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0)).toFixed(2);
            result += "\nperc5=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0.05)).toFixed(2);
            result += "\nQ1=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0.25)).toFixed(2);
            result += "\nMediana=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0.50)).toFixed(2);
            result += "\nQ3=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0.75)).toFixed(2);
            result += "\nPerc95=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 0.95)).toFixed(2);
            result += "\nMax=" + parseFloat("" + percentile(Object.values(area.values).map(a => a.value), 1)).toFixed(2);
        }
        return result;
    }

    public getTextWidth(text, font) {
        // Crea un elemento span temporaneo
        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "nowrap"; // Impedisce il testo a capo
        //span.style.font = font; // Imposta lo stile del font come l'elemento originale
        span.innerText = text;

        // Aggiungi lo span al documento per misurarne la larghezza
        document.body.appendChild(span);
        const width = span.offsetWidth;

        // Rimuovi lo span dal DOM
        document.body.removeChild(span);

        return width;
    }

    public displayTooltip(event, d) {
        var secondColumnWidth = d3.max([this.getTextWidth(d.area, undefined) + 5, 110]);
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

    public getDataFromDataview(dataView: DataView, options: VisualUpdateOptions) {
        //debugger;
        this.boxPlotData = [];
        const areas = dataView.categorical.categories[0].values
        var indexArea = 0;
        for (var indexArea = 0; indexArea < areas.length; indexArea++) {
            const area = <string>areas[indexArea];
            const values = <number[]>dataView.categorical.values.map(child => <number>child.values[indexArea] * 100);
            const categorySelectionId = this.host.createSelectionIdBuilder()
                .withCategory(dataView.categorical.categories[0], indexArea) // Una sola categoria ("Area Domanda")
                .createSelectionId();
            let data = calculateBoxPlotData(values, area, categorySelectionId);
            this.boxPlotData.push(data);
        }
    }

    // Definisci le proprietà di formattazione visualizzabili
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
        const instances: VisualObjectInstance[] = [];
        debugger;
        if (options.objectName === "lineOptions") {
            this.boxPlotData.forEach(d => {
                let selector: Selector = d.selectionId.getSelector()
                instances.push({
                    displayName: d.area,
                    objectName: options.objectName,
                    selector: null,
                    properties: {
                        fill: { solid: { color: "#000000" } }
                    },
                });
            });
        }

        return instances;
    }

    public creaAssi() {
        // Scala degli assi
        this.asseX = d3.scaleBand()
            .domain(this.boxPlotData.map(d => d.area))
            .range([0, this.width])
            .padding(0.2);

        this.asseY = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([this.height, 0]);

        // Crea l'elemento SVG
        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)


        let gtext = this.svg.append("g")
            .attr("transform", `translate(${this.asseX.bandwidth() / 2},10)`)
        gtext.append("text")
            .text("NUMERO DI INSEGNAMENTI VALUTATI: " + this.numberOfIns.length)
            .attr("dy", ".35em")
            .style("font-size", "10")
            .call(this.wrap, this.asseX.bandwidth() * 10)

        let g = this.svg
            .append("g")
            .attr("id", "svg-container")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Aggiungi asse X
        g.append("g")
            .attr("transform", `translate(0,${this.height + this.margin.xAxistop})`)
            .call(d3.axisBottom(this.asseX))
            .selectAll("line").remove();
        g.selectAll("text") // Seleziona tutte le etichette dell'asse X
            .style("text-anchor", "middle") // Centro il testo
            .attr("dy", ".35em")// Allineamento verticale del testo
            .call(this.wrap, this.asseX.bandwidth()); // Applica la funzione wrap per spezzare il testo

        // Aggiungi asse Y
        g.append("g")
            .call(d3.axisLeft(this.asseY))
            .selectAll("line").remove();
        g.selectAll("path").remove();
    }

    public aggiungiThreshold(percentage, attribs) {
        var line = this.root.select("#svg-container")
            .append("line")
            .attr("x1", 0)
            .attr("x2", this.width)
            .attr("y1", this.asseY(percentage))
            .attr("y2", this.asseY(percentage))
        for (var i of Object.keys(attribs)) {
            line.attr(i, attribs[i])
        }
    }
    
    public getFormattingModel(): powerbi.visuals.FormattingModel {
        //let formattingModel: powerbi.visuals.FormattingModel = this.formattingSettingsService.buildFormattingModel(this.visualSettings);
        let formattingModel = this.formattingSettingsService.buildFormattingModel(this.visualSettings);
        debugger;
        let group : FormattingCard = {
            displayName:"Line 1",
            aliasName:"lineSettings",
        }
        formattingModel.cards.push(group);
        return formattingModel;
/*
        const formattingModel: FormattingModel = {
            cards: []
        };
        // Gruppo per numero di linee
        const lineSettingsGroup: FormattingGroup = {
            displayName: "Line Settings",
            slices: [
                {
                    displayName: "General Settings",
                    properties: [
                        {
                            name: "numberOfLines",
                            displayName: "Number of Lines",
                            value: this.settings.lineSettings.numberOfLines,
                            type: { integer: { min: 0, max: 4 } }
                        }
                    ]
                }
            ]
        };
        
        formattingModel.groups.push(lineSettingsGroup);
        return formattingModel*/

    }

    public update(options: VisualUpdateOptions) {
        //debugger;
        this.options = options
        this.visualSettings = this.formattingSettingsService.populateFormattingSettingsModel(VisualSettings, options.dataViews[0]);
        console.log("SHO LOGO: ", this.visualSettings.circle.showLogo.value);
        if (this.visualSettings.circle.showLogo.value == false) {
            this.margin.right = 0;
        } else {
            this.margin.right = 100;
        }
        console.log(this.margin.right)
        this.width = options.viewport.width - this.margin.left - this.margin.right;
        this.height = options.viewport.height - this.margin.top - this.margin.bottom;
        // Pulisci tutti gli elementi
        this.svg.selectAll("*").remove()
        let dataView: DataView = options.dataViews[0];

        this.getDataFromDataview(dataView, options);
        this.numberOfIns = dataView.categorical.values.map(child => child.source.groupName)
        //debugger;

        // Creazione degli assi
        this.creaAssi()

        // Threshold line 25% e 50%
        this.aggiungiThreshold(25, { "stroke": "red", "stroke-dasharray": 4 })
        this.aggiungiThreshold(50, { "stroke": "#cccc00", "stroke-dasharray": 4 })


        // Disegna il boxplot per ciascuna area delle domande
        var indexColor = 0;
        const activeSelections = this.selectionManager.getSelectionIds();
        this.boxPlotData.forEach(d => {
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
                .attr("x", this.asseX(d.area))
                .attr("y", this.asseY(d.q3))
                .attr("height", this.asseY(d.q1) - this.asseY(d.q3))
                .attr("width", this.asseX.bandwidth())
                .attr("stroke", "black")
                .attr("fill", this.colors[indexColor % this.colors.length]);
            indexColor++;

            // Linea della mediana
            g1.append("line")
                .attr("x1", this.asseX(d.area))
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth())
                .attr("y1", this.asseY(d.median))
                .attr("y2", this.asseY(d.median))
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // Linea per i bound (upper_bound e lower_bound)
            g1.append("line")
                .attr("x1", this.asseX(d.area))
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth())
                .attr("y1", Math.min(d.lower_bound, d.min) == d.lower_bound ? this.asseY(d.min) : this.asseY(d.lower_bound))
                .attr("y2", Math.min(d.lower_bound, d.min) == d.lower_bound ? this.asseY(d.min) : this.asseY(d.lower_bound))
                .attr("stroke", "black");

            g1.append("line")
                .attr("x1", this.asseX(d.area))
                .attr("x2", this.asseX(d.area)! + this.asseX.bandwidth())
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
                        .attr("r", 3)
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
                    /*this.tooltipServiceWrapper.addTooltip(
                        g1,
                        (dataPoint: BoxPlotData) => <VisualTooltipDataItem[]>[
                            {displayName: "AREA",value: d.area},
                            {displayName: "Q1",value: d.q1.toFixed(4) + " %"},
                            {displayName: "Q3",value: d.q3.toFixed(4) + " %"},
                            {displayName: "Media",value: d.median.toFixed(4) + " %"},
                            {displayName: "Lower Bound", value: d.lower_bound.toFixed(4) + " %"},
                            {displayName: "Upper Bound", value: d.upper_bound.toFixed(4) + " %"}
                        ],
                        (dataPoint: BoxPlotData) => d.selectionId
                    );*/
                }
            } else {
                this.root.select("#tooltip").remove()
            }
        });
        if (this.visualSettings.circle.showLogo.value == true) {
            this.svg
                .append("image")
                .attr("xlink:href", "data:image/png;base64," + image)
                .attr("x", this.width - 70)  // Posizione X dell'immagine
                .attr("y", 0)  // Posizione Y dell'immagine
                .attr("width", this.visualSettings.circle.logoSize.value ? this.visualSettings.circle.logoSize.value : 300)  // Larghezza dell'immagine
                .attr("height", this.visualSettings.circle.logoSize.value ? this.visualSettings.circle.logoSize.value / 4 : 75);  // Altezza dell'immagine
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