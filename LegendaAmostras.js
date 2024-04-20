doc = activeDocument,
swatches = doc.swatches.getSelected(),
displayAs = "CMYKColor", //ou "RGBColor"CMYKColor
printColors = ["CMYK", "RGB", "HEX"], // RGB, CMYK, LAB e/ou escala de cinza , "LAB", "Escala de cinza"
splitColorComponents = false;
rectRef = null,
textRectRef = null,
textRef = null,
swatchColor = null,

/*
>>> CONFIGURAÇÕES GERAIS <<<
*/

cols = 4,               /* Numero de linhas de caixas de cores */
textSize = 10,          /* Tamanho da fonte da descrição */
w = 150;                /* Largura da caixa de cores */
h = 95,                 /* Altura da caixa de cores */
h_pad = 10,             /* Lacuna vertical entre caixas de cores */
v_pad = 75,             /* Espaço horizontal entre caixas de cores */
t_h_pad = 5,            /* Deslocamento vertical da descrição em relação ao lado esquerdo da caixa de cores */
t_v_pad = 100,          /* Deslocamento horizontal da descrição em relação ao lado superior da caixa de cores */
colorSeparator = ", ",  /* Caractere usado para separar as cores, por exemplo, "|" saída = R: XXX|G: XXX|B: XXX */

x = null,
y = null,
black = new GrayColor(),
white = new GrayColor();
black.gray = 100;
white.gray = 0;
activeDocument.layers[0].locked = false;
var newGroup = doc.groupItems.add();
newGroup.name = "NewGroup";
newGroup.move(doc, ElementPlacement.PLACEATBEGINNING);
for (var c = 0, len = swatches.length; c < len; c++) {
    var swatchGroup = doc.groupItems.add();
    swatchGroup.name = swatches[c].name;
    x = (w + h_pad) * ((c) % cols);
    y = (h + v_pad) * (Math.round(((c+2) + .03) / cols)) * -1;
    rectRef = doc.pathItems.rectangle(y, x, w, h);
    swatchColor = swatches[c].color;
    rectRef.fillColor = swatchColor;
    textRectRef = doc.pathItems.rectangle(y - t_v_pad, x + t_h_pad, 140, 50);
    textRef = doc.textFrames.areaText(textRectRef);
    textRef.contents = swatches[c].name + "\r" + getColorValues(swatchColor);
    textRef.textRange.fillColor = black;
    textRef.textRange.size = textSize;
    rectRef.move(swatchGroup, ElementPlacement.PLACEATBEGINNING);
    textRef.move(swatchGroup, ElementPlacement.PLACEATBEGINNING);
    swatchGroup.move(newGroup, ElementPlacement.PLACEATEND);
}

function getColorValues(c, spot) {
    if (c.typename) {
        if (c.typename == "SpotColor") {
            return getColorValues(c.spot.color, c.spot);
        };
        switch (c.typename) {
            case "RGBColor":
                sourceSpace = ImageColorSpace.RGB;
                colorComponents = [c.red, c.green, c.blue];
                break;
            case "CMYKColor":
                sourceSpace = ImageColorSpace.CMYK;
                colorComponents = [c.cyan, c.magenta, c.yellow, c.black];
                break;
            case "LabColor":
                sourceSpace = ImageColorSpace.LAB;
                colorComponents = [c.l, c.a, c.b];
                break;
            case "GrayColor":
                sourceSpace = ImageColorSpace.GrayScale;
                colorComponents = [c.gray];
                break;
        }
        var outputColors = new Array();
        for (var i = printColors.length - 1; i >= 0; i--) {
            colorType = printColors[i] == "HEX" ? "Indexed": printColors[i];
            targetSpace = ImageColorSpace[colorType] ;
            
            if (printColors[i] == 'LAB' && spot && spot.spotKind == 'SpotColorKind.SPOTLAB') {
                outputColors[i] = spot.getInternalColor();
            } else if(printColors[i] == 'HEX') {
                var _cr;
                var _cg;
                var _cb;
                if (app.activeDocument.documentColorSpace == DocumentColorSpace.CMYK) {
                    colorArray = [c.cyan, c.magenta, c.yellow, c.black];
                    rgbConv = app.convertSampleColor(ImageColorSpace["CMYK"], colorArray, ImageColorSpace["RGB"], ColorConvertPurpose.defaultpurpose);

                    _cr = rgbConv[0].toString(16);
                    _cg = rgbConv[1].toString(16);
                    _cb = rgbConv[2].toString(16);

                } else{
                    _cr = c.red.toString(16);
                    _cg = c.green.toString(16);
                    _cb = c.blue.toString(16);
                }

                if ( _cr.length == 1 ) {
                    _cr = "0"+_cr;
                }
                if ( _cg.length == 1 ) {
                    _cg = "0"+_cg;
                }
                if ( _cb.length == 1 ) {
                    _cb = "0"+_cb;
                }
                var _hexString = _cr+_cg+_cb;
                outputColors[i] = [_hexString];
            }
            else {
                outputColors[i] = app.convertSampleColor(sourceSpace, colorComponents, targetSpace, ColorConvertPurpose.previewpurpose);
            }

            for (var j = outputColors[i].length - 1; j >= 0; j--) {
                colorComp = splitColorComponents == true ? printColors[i].charAt(j) + ": " : "";
                if(isNaN(outputColors[i][j])){
                    outputColors[i][j] = colorComp + outputColors[i][j];
                } else {
                    if (outputColors[i][j].length != 6) {
                        outputColors[i][j] = colorComp + Math.round(outputColors[i][j]);
                    }
                }
                if (j == outputColors[i].length - 1) {
                    outputColors[i][j] += "\r";
                };
            };

            outputColors[i] = outputColors[i].join(colorSeparator);

            var _hexname = printColors[i]+ " ";

            if (_hexname == "HEX ") {
                _hexname = "#";
            }

            if(!splitColorComponents) outputColors[i] = _hexname + outputColors[i]
        };
        return outputColors.join("");
    }
    return "Non Standard Color Type";
}

function is_dark(c) {
    if (c.typename) {
        switch (c.typename) {
            case "CMYKColor":
                return (c.black > 50 || (c.cyan > 50 && c.magenta > 50)) ? true : false;
            case "RGBColor":
                return (c.red < 100 && c.green < 100) ? true : false;
            case "GrayColor":
                return c.gray > 50 ? true : false;
            case "SpotColor":
                return is_dark(c.spot.color);
                return false;
        }
    }
}