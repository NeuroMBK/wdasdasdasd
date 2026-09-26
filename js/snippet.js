/**
 * Исходный код на Python для эффекта ASCII-вихря и его токенизация
 */

export const RAW_CODE = [
    "import torch",
    "import torch.nn as nn",
    "import torch.nn.functional as F",
    "",
    "class ResidualBlock(nn.Module):",
    "    def __init__(self, in_channels, out_channels, stride=1):",
    "        super().__init__()",
    "        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)",
    "        self.bn1 = nn.BatchNorm2d(out_channels)",
    "        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)",
    "        self.bn2 = nn.BatchNorm2d(out_channels)",
    "        self.shortcut = nn.Sequential()",
    "        if stride != 1 or in_channels != out_channels:",
    "            self.shortcut = nn.Sequential(",
    "                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),",
    "                nn.BatchNorm2d(out_channels)",
    "            )",
    "",
    "    def forward(self, x):",
    "        out = F.relu(self.bn1(self.conv1(x)))",
    "        out = self.bn2(self.conv2(out))",
    "        out += self.shortcut(x)",
    "        return F.relu(out)",
    "",
    "model = nn.Sequential(",
    "    nn.Conv2d(1, 64, kernel_size=3, stride=1, padding=1),",
    "    ResidualBlock(64, 128, stride=2),",
    "    ResidualBlock(128, 256, stride=2),",
    "    nn.AdaptiveAvgPool2d((1, 1)),",
    "    nn.Flatten(),",
    "    nn.Linear(256, 10)",
    ")",
    "",
    "x = torch.randn(1, 1, 128, 128)",
    "output = model(x)"
];

// Палитра подсветки синтаксиса IDE (RGB)
export const SYNTAX_COLORS = {
    KEYWORD: [255, 123, 114], // #ff7b72
    TYPE:    [255, 166, 87],  // #ffa657
    FUNC:    [121, 192, 255], // #79c0ff
    STRING:  [126, 231, 135], // #7ee787
    NUMBER:  [210, 168, 255], // #d2a8ff
    COMMENT: [139, 148, 158], // #8b949e
    LINENUM: [72, 79, 88],    // #484f58
    DEFAULT: [230, 237, 243]  // #e6edf3
};

const KEYWORDS_REGEX = /^(import|class|def|return|if|else|super|as|from)$/;
const TYPES_REGEX = /^(torch|nn|Module|Conv2d|BatchNorm2d|Sequential|ReLU|AdaptiveAvgPool2d|Flatten|Linear|ResidualBlock)$/;
const FUNCS_REGEX = /^(init|forward|relu|randn|padding|stride|bias|kernel_size)$/;

export function tokenizeLine(line, lineNum) {
    const result = [];
    
    // Номер строки слева
    const numStr = (lineNum < 10 ? "0" + lineNum : "" + lineNum) + "  ";
    for (let ch of numStr) {
        result.push({ char: ch, color: SYNTAX_COLORS.LINENUM });
    }

    let i = 0;
    while (i < line.length) {
        // Строки
        if (line[i] === "'" || line[i] === '"') {
            const quote = line[i];
            result.push({ char: line[i], color: SYNTAX_COLORS.STRING });
            i++;
            while (i < line.length && line[i] !== quote) {
                result.push({ char: line[i], color: SYNTAX_COLORS.STRING });
                i++;
            }
            if (i < line.length) {
                result.push({ char: line[i], color: SYNTAX_COLORS.STRING });
                i++;
            }
            continue;
        }

        // Идентификаторы и ключевые слова
        if (/[a-zA-Z_]/.test(line[i])) {
            let word = "";
            while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) {
                word += line[i];
                i++;
            }
            
            let col = SYNTAX_COLORS.DEFAULT;
            if (KEYWORDS_REGEX.test(word)) {
                col = SYNTAX_COLORS.KEYWORD;
            } else if (TYPES_REGEX.test(word)) {
                col = SYNTAX_COLORS.TYPE;
            } else if (i < line.length && line[i] === '(') {
                col = SYNTAX_COLORS.FUNC;
            } else if (FUNCS_REGEX.test(word)) {
                col = SYNTAX_COLORS.FUNC;
            }

            for (let k = 0; k < word.length; k++) {
                result.push({ char: word[k], color: col });
            }
            continue;
        }

        // Числа
        if (/\d/.test(line[i])) {
            result.push({ char: line[i], color: SYNTAX_COLORS.NUMBER });
            i++;
            continue;
        }

        // Прочие символы
        result.push({ char: line[i], color: SYNTAX_COLORS.DEFAULT });
        i++;
    }
    return result;
}

export function getParsedSnippet() {
    return RAW_CODE.map((line, idx) => tokenizeLine(line, idx + 1));
}
