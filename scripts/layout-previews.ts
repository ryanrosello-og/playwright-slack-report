// Local illustration of the block types used by the showcase, not Slack's renderer.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import type { KnownBlock, TextObject } from '@slack/types';
import { layoutPreviews } from './layout-preview-data';

const root = path.resolve(import.meta.dir, '..');
const images = path.join(root, 'website/static/img/layouts');
const examples = path.join(root, 'website/static/examples/layouts');
await mkdir(images, { recursive: true });
await mkdir(examples, { recursive: true });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderText(text: TextObject): string {
  const escaped = escapeHtml(text.text);
  // The only mrkdwn these examples emit is labelled report/build links.
  return (
    text.type === 'mrkdwn'
      ? escaped.replace(/&lt;(.*?)\|(.*?)&gt;/g, '<a href="$1">$2</a>')
      : escaped
  ).replace(/\n/g, '<br>');
}

function renderBlock(block: KnownBlock): string {
  switch (block.type) {
    case 'header':
      return `<h2>${renderText(block.text)}</h2>`;
    case 'divider':
      return '<hr>';
    case 'section':
      return `<section>${block.text ? renderText(block.text) : ''}${block.fields ? `<div class="fields">${block.fields.map((field) => `<div>${renderText(field)}</div>`).join('')}</div>` : ''}</section>`;
    case 'context':
      return `<div class="context">${block.elements
        .map((element) => {
          if (element.type !== 'plain_text' && element.type !== 'mrkdwn')
            throw new Error('Unsupported context element');
          return renderText(element);
        })
        .join(' ')}</div>`;
    default:
      throw new Error(`Unsupported preview block: ${block.type}`);
  }
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 900, height: 1100 },
    deviceScaleFactor: 2,
  });
  for (const { id, layout, summary } of layoutPreviews) {
    const blocks = layout(summary);
    await writeFile(
      path.join(examples, `${id}.json`),
      `${JSON.stringify({ blocks }, null, 2)}\n`,
    );
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><title>${id} preview</title>
      <style>
        *{box-sizing:border-box}body{margin:0;background:#f4f3f7;color:#1d1c1d;font:16px/1.5 "Segoe UI",Arial,sans-serif}
        .preview{padding:28px;width:860px}.card{background:white;border:1px solid #dedce5;border-radius:12px;overflow:hidden}
        .channel{padding:16px 24px;border-bottom:1px solid #e8e7eb;font-weight:700;font-size:17px}
        .message{display:flex;gap:14px;padding:24px}.avatar{flex:none;background:#4a254b;color:white;border-radius:9px;width:42px;height:42px;display:grid;place-items:center;font-size:24px}
        .content{min-width:0;flex:1}.sender{font-weight:700}.app{font-size:10px;background:#f0eff2;color:#666;padding:2px 4px;border-radius:3px;margin:0 8px}.time{font-size:12px;font-weight:400;color:#787478}
        h2{font-size:21px;line-height:1.3;margin:14px 0 18px}section{margin:14px 0;overflow-wrap:anywhere}.fields{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px}.fields>div{white-space:normal}
        hr{border:0;border-top:1px solid #e7e5e8;margin:18px 0}.context{color:#676267;font-size:13px;margin:12px 0}a{color:#1264a3;text-decoration:none}
        .caption{font-size:11px;color:#78717d;letter-spacing:1px;margin-top:14px;text-align:right}
      </style><div class="preview"><div class="card"><div class="channel"># ci-results</div><div class="message"><div class="avatar">🎭</div><div class="content"><div class="sender">Playwright<span class="app">APP</span><span class="time">10:42 AM</span></div>${blocks.map(renderBlock).join('')}</div></div></div><div class="caption">LOCAL BLOCK KIT PREVIEW · SAMPLE DATA</div></div></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page
      .locator('.preview')
      .screenshot({ path: path.join(images, `${id}.png`) });
    console.log(`Generated ${id}.png and ${id}.json`);
  }
} finally {
  await browser.close();
}

const source = await readFile(
  path.join(root, 'custom_block/showcase.ts'),
  'utf8',
);
await writeFile(
  path.join(examples, 'showcase.ts'),
  source
    .replace(
      "// In your project, change '../src' to 'playwright-slack-report/dist/src'.\n",
      '',
    )
    .replace("from '../src'", "from 'playwright-slack-report/dist/src'"),
);
