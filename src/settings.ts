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

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

/**
 * Data Point Formatting Card
 */
class DataPointCardSettings extends FormattingSettingsCard {
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
        value: 2,
        visible: true
    })

    public name: string = "settings";
    public displayName: string = "Impostazioni di stile";
    public visible: boolean = true;
    public slices: FormattingSettingsSlice[] = [this.showLogo, this.logoSize, this.nOfThresholdLines];
}

class ThresholdOptions extends FormattingSettingsCard{
    public lineColors = new formattingSettings.ColorPicker({
        name: "lineColor",
        displayName: "Colore della linea",
        value: { value: "#000000" },
        visible: true
    });

    public lineValues = new formattingSettings.NumUpDown({
        name: "lineValues",
        displayName: "Valore della linea",
        value: 25,
        visible: true
    })

    public name: string = "lineOptions"
    public displayName: string = "Opzioni linee";
    public visible: boolean = true;
    public slices: FormattingSettingsSlice[] =  [ this.lineColors, this.lineValues];
}

/**
* visual settings model class
*
*/
export class VisualSettings extends FormattingSettingsModel {

    public circle: DataPointCardSettings = new DataPointCardSettings();
    public thres : ThresholdOptions = new ThresholdOptions();
    public cards: FormattingSettingsCard[] = [this.circle, this.thres];
}
