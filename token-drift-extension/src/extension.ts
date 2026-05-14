import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  console.log('✅ Token Drift Detector activated');

  const outputChannel = vscode.window.createOutputChannel('Token Drift');
  let tokenMap: Map<string, string> = new Map();

  // ========================================
  // FUNCTION: Load tokens from file
  // ========================================
  function loadTokens() {
    try {
      // Get workspace path
      const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (!workspacePath) {
        outputChannel.appendLine('❌ No workspace folder found');
        vscode.window.showErrorMessage('Token Drift: No workspace folder open');
        return;
      }

      // EDGE CASE #3: Missing File Error Handling
      const tokenPath = path.join(workspacePath, 'tokens', 'tokens.dtcg.json');
      
      if (!fs.existsSync(tokenPath)) {
        outputChannel.appendLine(`❌ tokens.dtcg.json not found at: ${tokenPath}`);
        vscode.window.showErrorMessage(
          'Token Drift: tokens.dtcg.json not found in tokens/ folder'
        );
        return;
      }

      // Load and parse tokens file
      const tokenContent = fs.readFileSync(tokenPath, 'utf-8');
      let tokenData;
      
      try {
        tokenData = JSON.parse(tokenContent);
      } catch (parseError) {
        outputChannel.appendLine(`❌ tokens.dtcg.json has invalid JSON: ${parseError}`);
        vscode.window.showErrorMessage('Token Drift: tokens.dtcg.json has invalid JSON');
        return;
      }

      // Clear old tokens and rebuild index
      tokenMap.clear();
      buildTokenIndex(tokenData, '', tokenMap);
      outputChannel.appendLine(`✅ Loaded ${tokenMap.size} tokens`);

    } catch (error) {
      outputChannel.appendLine(`❌ Error loading tokens: ${error}`);
      vscode.window.showErrorMessage(`Token Drift Error: ${error}`);
    }
  }

  // ========================================
  // FUNCTION: Build index of token values
  // ========================================
  function buildTokenIndex(obj: any, prefix: string, map: Map<string, string>) {
    for (const key in obj) {
      if (obj[key].$value) {
        const tokenValue = String(obj[key].$value).toLowerCase();
        const tokenName = prefix ? `${prefix}.${key}` : key;
        map.set(tokenValue, tokenName);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        buildTokenIndex(obj[key], newPrefix, map);
      }
    }
  }

  // Load tokens on startup
  loadTokens();

  // Watch for token file changes and reload
  const tokenWatcher = vscode.workspace.createFileSystemWatcher('**/tokens/tokens.dtcg.json');
  tokenWatcher.onDidChange(() => {
    outputChannel.appendLine('🔄 Tokens file changed, reloading...');
    loadTokens();
  });

  // EDGE CASE #1: Detect RGB/RGBA/HSL Formats
  // Create decoration type for violations
  const violationDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 200, 0, 0.3)',
    borderColor: 'rgba(255, 150, 0, 0.7)',
    borderWidth: '2px',
    borderStyle: 'wavy',
    color: '#FF9900',
    overviewRulerColor: 'rgba(255, 150, 0, 0.7)',
    overviewRulerLane: vscode.OverviewRulerLane.Right,
    isWholeLine: false
  });

  // ========================================
  // FUNCTION: Check current document for violations
  // ========================================
  function checkDocument(document: vscode.TextDocument) {
    if (!document) return;

    // EDGE CASE #4: Large File Performance
    // Skip if file is too large (>10000 lines)
    if (document.lineCount > 10000) {
      outputChannel.appendLine(`⚠️  Skipping large file: ${document.fileName} (${document.lineCount} lines)`);
      return;
    }

    const violations: vscode.Range[] = [];
    const documentText = document.getText();

    // EDGE CASE #2: Skip comments
    const lines = documentText.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comment lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        continue;
      }

      // EDGE CASE #1: Check multiple color formats
      // Check HEX colors (#RRGGBB)
      const hexRegex = /#[0-9A-Fa-f]{6}\b/g;
      let match;
      
      while ((match = hexRegex.exec(line)) !== null) {
        const colorValue = match[0].toLowerCase();
        if (tokenMap.has(colorValue)) {
          const range = new vscode.Range(i, match.index, i, match.index + colorValue.length);
          violations.push(range);
        }
      }

      // Check RGB colors (rgb(r, g, b))
      const rgbRegex = /rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi;
      while ((match = rgbRegex.exec(line)) !== null) {
        const colorValue = match[0].toLowerCase().replace(/\s/g, '');
        if (tokenMap.has(colorValue)) {
          const range = new vscode.Range(i, match.index, i, match.index + match[0].length);
          violations.push(range);
        }
      }

      // Check RGBA colors (rgba(r, g, b, a))
      const rgbaRegex = /rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/gi;
      while ((match = rgbaRegex.exec(line)) !== null) {
        const colorValue = match[0].toLowerCase().replace(/\s/g, '');
        if (tokenMap.has(colorValue)) {
          const range = new vscode.Range(i, match.index, i, match.index + match[0].length);
          violations.push(range);
        }
      }
    }

    // Apply decorations to editor
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document === document) {
      activeEditor.setDecorations(violationDecoration, violations);

      if (violations.length > 0) {
        outputChannel.appendLine(`⚠️  Found ${violations.length} potential token violation(s) in ${document.fileName}`);
      }
    }
  }

  // Listen for open documents
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor) {
        checkDocument(editor.document);
      }
    })
  );

  // Listen for document changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      checkDocument(event.document);
    })
  );

  // Check initial document
  if (vscode.window.activeTextEditor) {
    checkDocument(vscode.window.activeTextEditor.document);
  }

  // Cleanup
  context.subscriptions.push(tokenWatcher);
}

export function deactivate() {}