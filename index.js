// Require our dependencies
const fs = require('fs');
const csstree = require('css-tree');
const argv = require('minimist')(process.argv.slice(2));
const util = require('util');
const cssbeautify = require('cssbeautify');

// https://astexplorer.net/#/gist/fff490f2895e75dcac1015a28c497972/02b0b6b63b4d709e34757fae622211ccb47217a9
function uncss() {
  // Loop through all of our passed files
  argv._.forEach((filename) => {
    // Parse the file contents
    const fileContent = fs.readFileSync(filename, 'utf8');
    // Get our ast
    const ast = csstree.parse(fileContent);
    // Define our container for our rules that append ':root'
    const rootRules = [];

    // Walk through all of the top level rules of the ast
    csstree.walkRules(ast, (node, ruleItem, ruleList) => {
      if(node.block && node.selector) {
        // Create a new rule with of our rule with :root
        //csstree.translate can be used for any type of ast snippet, such as single rules or selectors
        const rootRule =
          csstree.parse(`:root ${csstree.translate(node.selector)} {}`).children.toArray()[0];

        // Walk through all of the declarations within the rule
        csstree.walkDeclarations(node, (declaration, item, list) => {
          if(declaration.important && list) {
            // Remove the rule from the original ast
            list.remove(item);

            // Remove the important, and add to the root Rule for this rule
            declaration.important = false;
            rootRule.block.children.append(csstree.List.createItem(declaration));
          }
        });

        // Add the root rule if we added any declarations
        if(!rootRule.block.children.isEmpty()) {
          rootRules.push(rootRule);
        }
      }
    });

    //Add our root rules to our ast, and convert back to the List format
    ast.children = ast.children.toArray().concat(rootRules);
    csstree.fromPlainObject(ast);

    // TODO: Remove any unused blocks

    //TODO: Allow passing in file output name
    fs.writeFileSync('output.css',
      cssbeautify(csstree.translate(ast),
      {
        indent: '  ',
        openbrace: 'end-of-line',
        autosemicolon: true
      }),
      'utf8');
  });
}

//Call the function for testing
uncss();
module.exports = uncss;
