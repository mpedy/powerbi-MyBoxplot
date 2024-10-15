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
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import DataView = powerbi.DataView;
import IVisualHost = powerbi.extensibility.IVisualHost;
import * as d3 from "d3";
import { image } from "./unige_image";

type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

interface BoxPlotData {
    area: string;
    min: number;
    max: number;
    q1: number;
    median: number;
    q3: number;
    iqr: number;
    lower_bound: number;
    upper_bound: number;
    values: number[];
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private svg: Selection<SVGElement>;
    private container: Selection<SVGElement>;
    private margin = { top: 30, right: 100, bottom: 50, left: 30, xAxistop: 15 };
    private options: VisualUpdateOptions;
    private isAMeasure = false
    private colors = ["#008fd3", "#99d101", "#f39b02", "#9fcfec", "#4ba707", "#f6d133", "#cb4d2c", "#cac7ba", "#0d869c", "#cdd72e", "#247230", "#6cdedc"];

    constructor(options: VisualConstructorOptions) {
        console.log("Visual build options", options)
        console.log("Salvato", this.options)
        this.svg = d3.select(options.element)
            .append('svg')

    }

    public calculateBoxPlotData(values: number[], area: string): BoxPlotData {
        const min = this.percentile(values, 0.00);
        const q1 = this.percentile(values, 0.25);
        const median = this.percentile(values, 0.50);
        const q3 = this.percentile(values, 0.75);
        const max = this.percentile(values, 1.00);
        const iqr = q3 - q1;
        // Supponendo che i dati siano in percentuali!
        const lower_bound = Math.max(q1 - 1.5 * iqr, 0)
        const upper_bound = Math.min(q3 + 1.5 * iqr, 100)

        return {
            area,
            min,
            max,
            q1,
            median,
            q3,
            iqr,
            lower_bound,
            upper_bound,
            values
        };
    }
    public percentile = (arr, val) => d3.quantile(arr, val);
    public calculations(dataView: DataView) {
        var result = ""
        for (var area of dataView.matrix.rows.root.children) {
            result += area.value + " : ";
            result += "\nMin=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0)).toFixed(2);
            result += "\nperc5=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0.05)).toFixed(2);
            result += "\nQ1=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0.25)).toFixed(2);
            result += "\nMediana=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0.50)).toFixed(2);
            result += "\nQ3=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0.75)).toFixed(2);
            result += "\nPerc95=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 0.95)).toFixed(2);
            result += "\nMax=" + parseFloat("" + this.percentile(Object.values(area.values).map(a => a.value), 1)).toFixed(2);
        }
        return result;
    }

    public update(options: VisualUpdateOptions) {
        this.options = options
        console.log("Update options", options)
        this.svg.selectAll("*").remove()
        //debugger;
        let dataView: DataView = options.dataViews[0];
        console.log("Dataview", dataView)
        let width: number = options.viewport.width - this.margin.left - this.margin.right;
        let height: number = options.viewport.height - this.margin.top - this.margin.bottom;
        var boxPlotData: BoxPlotData[];
        var numberOfIns = []
        //debugger;
        if (this.isAMeasure) {
            const children = dataView.matrix.rows.root.children;

            // Estrai i dati
            boxPlotData = children.map((child: any) => {
                const area = child.value; // Nome dell'area delle domande (es. "CONOSCENZE")
                const values = Object.values(child.values).map((v: any) => v.value * 100 as number); // Valori per il boxplot
                return this.calculateBoxPlotData(values, area);
            });
        } else {
            const children = dataView.matrix.columns.root.children;
            var aree = {}
            for (var child of children) {
                let val = child.value.toString().split("-")
                let area = val[0]
                let numb = parseFloat(val[1].replace(",", "."))
                let indexOrder = parseInt(val[2])
                aree[indexOrder.toString() + "-" + area] ? aree[indexOrder.toString() + "-" + area].push(numb) : aree[indexOrder.toString() + "-" + area] = [numb];
                numberOfIns.push(child.levelValues[0].value)
            }
            let orderedKeys = Object.keys(aree).sort()
            let aree2 = {}
            for (var k of orderedKeys) {
                aree2[k] = aree[k]
            }
            aree = aree2
            // Estrai i dati
            boxPlotData = Object.keys(aree).map((k: any) => {
                const area = k.split("-")[1]; // Nome dell'area delle domande (es. "CONOSCENZE")
                const values = aree[k]//.map((v: any) => v as number); // Valori per il boxplot
                return this.calculateBoxPlotData(values, area);
            });
        }

        // Scala degli assi
        const x = d3.scaleBand()
            .domain(boxPlotData.map(d => d.area))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, 100])
            .nice()
            .range([height, 0]);


        // Crea l'elemento SVG
        this.svg
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
        let gtext = this.svg.append("g")
            .attr("transform", `translate(${x.bandwidth() / 2},10)`)
        gtext.append("text")
            .text("NUMERO DI INSEGNAMENTI VALUTATI: " + numberOfIns.length)
            .attr("dy", ".35em")
            .style("font-size", "10")
            .call(wrap, x.bandwidth() * 10)

        let g = this.svg
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Aggiungi asse X
        g.append("g")
            .attr("transform", `translate(0,${height + this.margin.xAxistop})`)
            .call(d3.axisBottom(x))
            .selectAll("line").remove();
        g.selectAll("text") // Seleziona tutte le etichette dell'asse X
            .style("text-anchor", "middle") // Centro il testo
            .attr("dy", ".35em")// Allineamento verticale del testo
            .call(wrap, x.bandwidth()); // Applica la funzione wrap per spezzare il testo

        // Aggiungi asse Y
        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("line").remove();
        g.selectAll("path").remove();

        // Threshold line 25% e 50%
        g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(25))
            .attr("y2", y(25))
            .attr("stroke", "red")
            .attr("stroke-dasharray", 4)

        g.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(50))
            .attr("y2", y(50))
            .attr("stroke", "#cccc00")
            .attr("stroke-dasharray", 4)

        // Disegna il boxplot per ciascuna area delle domande
        var indexColor = 0;
        boxPlotData.forEach(d => {
            console.log(d)
            // Linea verticale del boxplot (dal lower bound al upper bound)
            g.append("line")
                .attr("x1", x(d.area)! + x.bandwidth() / 2)
                .attr("x2", x(d.area)! + x.bandwidth() / 2)
                .attr("y1", Math.min(d.lower_bound, d.min) == d.lower_bound ? y(d.min) : y(d.lower_bound))
                .attr("y2", Math.max(d.upper_bound, d.max) == d.upper_bound ? y(d.max) : y(d.upper_bound))
                .attr("stroke", "black");

            // Box dal Q1 al Q3
            g.append("rect")
                .attr("x", x(d.area))
                .attr("y", y(d.q3))
                .attr("height", y(d.q1) - y(d.q3))
                .attr("width", x.bandwidth())
                .attr("stroke", "black")
                .attr("fill", "#69b3a2")
                .attr("fill", this.colors[indexColor]);
            indexColor++;

            // Linea della mediana
            g.append("line")
                .attr("x1", x(d.area))
                .attr("x2", x(d.area)! + x.bandwidth())
                .attr("y1", y(d.median))
                .attr("y2", y(d.median))
                .attr("stroke", "black")
                .attr("stroke-width", 2);

            // Linea per i bound (upper_bound e lower_bound)
            g.append("line")
                .attr("x1", x(d.area))
                .attr("x2", x(d.area)! + x.bandwidth())
                .attr("y1", Math.min(d.lower_bound, d.min) == d.lower_bound ? y(d.min) : y(d.lower_bound))
                .attr("y2", Math.min(d.lower_bound, d.min) == d.lower_bound ? y(d.min) : y(d.lower_bound))
                .attr("stroke", "black");

            g.append("line")
                .attr("x1", x(d.area))
                .attr("x2", x(d.area)! + x.bandwidth())
                .attr("y1", Math.max(d.upper_bound, d.max) == d.upper_bound ? y(d.max) : y(d.upper_bound))
                .attr("y2", Math.max(d.upper_bound, d.max) == d.upper_bound ? y(d.max) : y(d.upper_bound))
                .attr("stroke", "black");

            // Outliers
            for (var val of d.values) {
                if (val < d.lower_bound || val > d.upper_bound) {
                    g.append("circle")
                        .style("fill", "white")
                        .style("fill-opacity", "0.5")
                        .style("stroke", "black")
                        .attr("r", 3)
                        .attr("cx", x(d.area)! + x.bandwidth() / 2)
                        .attr("cy", y(val))
                }
            }
        });
        this.svg
            .append("image")
            .attr("xlink:href", "data:image/png;base64," + image)
            .attr("x", width - 70)  // Posizione X dell'immagine
            .attr("y", 0)  // Posizione Y dell'immagine
            .attr("width", 300)  // Larghezza dell'immagine
            .attr("height", 75);  // Altezza dell'immagine
        // Funzione per spezzare le etichette troppo lunghe
        function wrap(text, width) {
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
}