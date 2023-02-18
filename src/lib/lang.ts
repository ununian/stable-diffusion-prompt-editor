import * as monaco from 'monaco-editor';
import init, { cst, PromptCST } from 'stable-diffusion-prompt-parser';
import { flatMapDeep, isString } from 'lodash-es';

const BracketColor = ['00ff00', 'e36414', '4361ee', 'fff3b0', '8338ec'];

const legend: monaco.languages.SemanticTokensLegend = {
  tokenTypes: [
    'SingleTag',
    'Bracket_1',
    'Bracket_2',
    'Bracket_3',
    'Bracket_4',
    'Bracket_5',
  ],
  tokenModifiers: ['normal'],
};

export class LineData {
  public data: number[] = [];
  private _prevChar: number = 0;

  public constructor(public readonly line: number) {}

  private _appendInner(
    colPosition: number,
    length: number,
    type: number,
    modifier: number
  ) {
    this.data.push(0, colPosition - this._prevChar, length, type, modifier);
    this._prevChar = colPosition;
  }

  public appendTokens(tokens: PromptCST[]) {
    tokens.forEach((token) => {
      this.appendTokenItem(token);
    });
  }

  public appendTokenItem(token: PromptCST) {
    if (isString(token.kind) && ['TagStatement'].includes(token.kind)) {
      return this.appendTokens(token.inner);
    }

    if (token.kind === 'SingleTag') {
      this._appendInner(token.range[0], token.range[1] - token.range[0], 0, 0);
    } else if (!isString(token.kind) && token.kind.Bracket) {
      const level = token.kind.Bracket[1] > 4 ? 4 : token.kind.Bracket[1];

      this._appendInner(token.range[0], 1, level + 1, 0);
      this.appendTokens(token.inner);
      this._appendInner(token.range[1] - 1, 1, level + 1, 0);
    }
  }
}

const flatTokens = (tokens: PromptCST[]): PromptCST[] => {
  return flatMapDeep(tokens, (token) => {
    return [token, ...flatTokens(token.inner)];
  });
};

monaco.languages.registerDocumentSemanticTokensProvider('plaintext', {
  getLegend: function () {
    return legend;
  },
  provideDocumentSemanticTokens: function (model, lastResultId, token) {
    const lines = model.getLinesContent();

    const data = lines.reduce((acc, lineContent, lineIndex) => {
      const tokens = cst(lineContent) as PromptCST[];
      const lineData = new LineData(lineIndex);
      lineData.appendTokens(tokens);
      acc.push(...lineData.data.flat());
      return acc;
    }, [] as number[]);

    return {
      data: new Uint32Array(data),
      resultId: undefined,
    };
  },
  releaseDocumentSemanticTokens: function (resultId) {},
});

monaco.languages.registerHoverProvider('plaintext', {
  provideHover: function (model, position) {
    // console.log(model.getWordAtPosition(position));

    // get line content
    const lineContent = model.getLineContent(position.lineNumber);
    const cstContent = flatTokens(cst(lineContent) as PromptCST[]);

    // get single tag at position
    const tag = cstContent.find((token) => {
      if (token.kind === 'SingleTag') {
        const [start, end] = token.range;
        const startCol = position.column;
        if (startCol >= start && startCol <= end) {
          return true;
        }
      }
    });
    if (tag) {
      const words = tag.inner.map((token) => token.text);
      const contents = words.map((word) => ({
        value: `${word} --- ${word}翻译`,
      }));
      if (tag.bracket_modifier.length > 0) {
        contents.unshift({ value: `优先级: ${tag.bracket_modifier}` });
      }
      return {
        range: new monaco.Range(
          position.lineNumber,
          tag.range[0] + 1,
          position.lineNumber,
          tag.range[1] + 1
        ),
        contents,
      };
    }
  },
});

// add some missing tokens
monaco.editor.defineTheme('myCustomTheme', {
  base: 'vs-dark',
  inherit: true,
  colors: {},
  rules: [
    { token: 'SingleTag', foreground: 'fec89a' },
    ...BracketColor.map((color, i) => ({
      token: `Bracket_${i + 1}`,
      foreground: color,
    })),
    { token: 'txt', foreground: 'ce63eb' },
  ],
});

export const create = async (el: HTMLElement) => {
  await init();
  const editor = monaco.editor.create(el, {
    value: [
      '((best quality)), ((masterpiece)), highres, original, extremely detailed wallpaper,an extremely delicate and beautiful,illustration,cinematic lighting, volume lighting, bloom effect, light particles,((1 girl)),beautiful detailed eyes,long sleeves, hoodie,frills, no shadow, simple background, (((black background))), European style, bright skin, (((1980s (style)))), movie theater,  silhouette, greyscale, monochrome,((Big wavy curls)), slit pupils,(((looking back))),cinematic angle, (((close-up))),(((portrait))),lens flare,seductive smile, tarot, medium hair',
    ].join('\n'),
    // value: ['((a)), ((b))'].join('\n'),
    language: 'plaintext',
    theme: 'myCustomTheme',
    wordWrap: 'on',
    // semantic tokens provider is disabled by default
    'semanticHighlighting.enabled': true,
  });
};
