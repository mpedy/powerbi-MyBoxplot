/*
 *  Power BI Visualizations
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

//"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import powerbiVisualsApi from "powerbi-visuals-api";

import Card = formattingSettings.SimpleCard;
import Slice = formattingSettings.Slice;
import Model = formattingSettings.Model;
import { BoxPlotData } from "./boxplotdata";
import { ThresholdLines } from "./thresholdLines";

/**
 * Data Point Formatting Card
 */
class ImpostazioniDiStile extends Card {
    public boxSize = new formattingSettings.NumUpDown({
        name: "Box size",
        displayName: "Gestisci la larghezza dei box",
        value: 0,
        visible: true,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 50,
            }
        },
    });

    public outliersRadius = new formattingSettings.NumUpDown({
        name: "Outliers radius",
        displayName: "Raggio del cerchio degli outliers",
        value: 3,
        visible: true,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 1,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 10,
            }
        }
    });

    public showLogo = new formattingSettings.ToggleSwitch({
        name: "View logo",
        displayName: "Visualizza il logo",
        value: true,
        visible: true
    });

    public logoSize = new formattingSettings.NumUpDown({
        name: "Logo size",
        displayName: "Larghezza del logo",
        value: 300,
        visible: true
    });

    public nOfThresholdLines = new formattingSettings.NumUpDown({
        name: "Number of threshold lines",
        displayName: "Numero di linee per il threshold",
        value: 0,
        options: {
            minValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Min,
                value: 0,
            },
            maxValue: {
                type: powerbiVisualsApi.visuals.ValidatorType.Max,
                value: 4,
            }
        },
        visible: true
    })

    public show_buttons = new formattingSettings.ToggleSwitch({
        name: "Show buttons",
        displayName: "Visualizza filtri pulsanti",
        value: false,
        visible: true
    });

    public show_right_yaxis = new formattingSettings.ToggleSwitch({
        name: "Show right yaxis",
        displayName: "Visualizza asse Y anche a destra",
        value: false,
        visible: true
    });

    public show_questionari_bianchi = new formattingSettings.ToggleSwitch({
        name: "Visualizza questionari bianchi",
        displayName: "Visualizza questionari bianchi",
        value: false,
        visible: true
    });

    public show_legend = new formattingSettings.ToggleSwitch({
        name: "Show legend",
        displayName: "Visualizza legenda",
        value: true,
        visible: true
    });

    public show_legend_in_graph = new formattingSettings.ToggleSwitch({
        name: "Show legend in graph",
        displayName: "Visualizza legenda all'interno del grafico",
        value: false,
        visible: true
    });

    public name: string = "stile";
    public displayName: string = "Impostazioni di stile";
    public visible: boolean = true;
    public slices: Slice[] = [this.boxSize, this.outliersRadius, this.showLogo, this.logoSize, this.nOfThresholdLines, this.show_buttons, this.show_questionari_bianchi, this.show_right_yaxis, this.show_legend, this.show_legend_in_graph];
}

class ColorazioneAree extends Card {
    public name: string = "colorSelector";
    public displayName: string = "Colorazione delle Aree";
    public visible = true;
    public slices: Slice[] = [];
}

class OpzioniThreshold extends Card {
//class OpzioniThreshold extends GroupCard {
    public lineColor1 = new formattingSettings.ColorPicker({
        name: "lineColor1",
        displayName: "Colore della linea 1",
        value: { value: "#000000" },
        visible: false
    });

    public lineValue1 = new formattingSettings.NumUpDown({
        name: "lineValue1",
        displayName: "Valore della linea 1",
        value: 25,
        visible: false
    })

    public lineText1 = new formattingSettings.TextInput({
        name: "lineText1",
        displayName: "Nome della linea 1",
        value: "Linea 1",
        placeholder: "Linea 1",
        visible: false
    })

    public lineColor2 = new formattingSettings.ColorPicker({
        name: "lineColor2",
        displayName: "Colore della linea 2",
        value: { value: "#000000" },
        visible: false
    });

    public lineValue2 = new formattingSettings.NumUpDown({
        name: "lineValue2",
        displayName: "Valore della linea 2",
        value: 25,
        visible: false
    })

    public lineText2 = new formattingSettings.TextInput({
        name: "lineText2",
        displayName: "Nome della linea 2",
        value: "Linea 2",
        placeholder: "Linea 2",
        visible: false
    })

    public lineColor3 = new formattingSettings.ColorPicker({
        name: "lineColor3",
        displayName: "Colore della linea 3",
        value: { value: "#000000" },
        visible: false
    });

    public lineValue3 = new formattingSettings.NumUpDown({
        name: "lineValue3",
        displayName: "Valore della linea 3",
        value: 25,
        visible: false
    })

    public lineText3 = new formattingSettings.TextInput({
        name: "lineText3",
        displayName: "Nome della linea 3",
        value: "Linea 3",
        placeholder: "Linea 3",
        visible: false
    })

    public lineColor4 = new formattingSettings.ColorPicker({
        name: "lineColor4",
        displayName: "Colore della linea 4",
        value: { value: "#000000" },
        visible: false
    });

    public lineValue4 = new formattingSettings.NumUpDown({
        name: "lineValue4",
        displayName: "Valore della linea 4",
        value: 25,
        visible: false
    })

    public lineText4 = new formattingSettings.TextInput({
        name: "lineText4",
        displayName: "Nome della linea 4",
        value: "Linea 4",
        placeholder: "Linea 4",
        visible: false
    })

    public getThresholdLine(index: number) : [formattingSettings.ColorPicker, formattingSettings.NumUpDown, formattingSettings.TextInput] {
        if (index == 1) {
            return [this.lineColor1, this.lineValue1, this.lineText1];
        } else if (index == 2) {
            return [this.lineColor2, this.lineValue2, this.lineText2];
        } else if (index == 3) {
            return [this.lineColor3, this.lineValue3, this.lineText3];
        } else if (index == 4) {
            return [this.lineColor4, this.lineValue4, this.lineText4];
        }
    }

    public getColor(index: number) {
        if (index == 1) {
            return this.lineColor1.value;
        } else if (index == 2) {
            return this.lineColor2.value;
        } else if (index == 3) {
            return this.lineColor3.value;
        } else if (index == 4) {
            return this.lineColor4.value;
        }
    }

    public name: string = "lineOptions"
    public displayName: string = "Opzioni linee threshold";
    public visible: boolean = false;
    public slices: Slice[] = [
        this.lineColor1, this.lineValue1, this.lineText1,
        this.lineColor2, this.lineValue2, this.lineText2,
        this.lineColor3, this.lineValue3, this.lineText3,
        this.lineColor4, this.lineValue4, this.lineText4
    ];

    public activate_line(i: number) {
        switch (i) {
            case 1:
                this.lineColor1.visible = true
                this.lineValue1.visible = true
                this.lineText1.visible = true
                break
            case 2:
                this.lineColor2.visible = true
                this.lineValue2.visible = true
                this.lineText2.visible = true
                break
            case 3:
                this.lineColor3.visible = true
                this.lineValue3.visible = true
                this.lineText3.visible = true
                break
            case 4:
                this.lineColor4.visible = true
                this.lineValue4.visible = true
                this.lineText4.visible = true
                break
        }
    }
}

/**
* visual settings model class
*
*/
export class VisualSettings extends Model {

    public stile: ImpostazioniDiStile = new ImpostazioniDiStile();
    public thres: OpzioniThreshold = new OpzioniThreshold();
    public colorSelector: ColorazioneAree = new ColorazioneAree();
    public cards: Card[] = [this.stile, this.thres, this.colorSelector];


    public populateColorSelector(data: BoxPlotData[]) {
        let slices = this.colorSelector.slices;
        if (data) {
            data.forEach(d => {
                slices.push(new formattingSettings.ColorPicker({
                    name: "fill",
                    displayName: d.area,
                    value: { value: d.color },
                    visible: true,
                    selector: d.selectionId.getSelector()
                }));
            });
        }
    }

    /*public populateLineOptions(thresholdLines: ThresholdLines[]) {
        //let slices = this.thres.slices;
        let slices = this.thres.groups;
        debugger;
        var index = 0;
        thresholdLines.forEach(th => {
            slices.push(
                new formattingSettings.ColorPicker({
                    name: "lineColor",
                    displayName: `Colore linea ${th.getValue()}%`,
                    value: { value: th.getColor() },
                    visible: true
                })
            )
        });
    }*/
}
