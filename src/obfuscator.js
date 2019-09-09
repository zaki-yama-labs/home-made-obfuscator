const { RefactorSession } = require('shift-refactor');
const { parseScript } = require('shift-parser');
const Shift = require('shift-ast');
const fs = require('fs');

function obfuscateFPScript(src, dest) {
  // we read the content of the fingerprinting script(not obfuscated)
  const fileContents = fs.readFileSync(src, 'utf8');

  // We use the shift-ast library to parse the script and build an ast
  const tree = parseScript(fileContents);

  // We initialize a refactor session that we use to query nodes in the ast for example
  const refactor = new RefactorSession(tree);

  // The 5 statemenets below extract the different strings, numbers and object properties
  // that we want to obfuscate
  // refactor.query enables to query specific nodes from the AST using a syntax similar to CSS
  // Thus, for example refactor.query('LiteralStringExpression') will return all the LiteralStringExpression
  // in the program.
  const stringsProgram = Array.from(new Set(refactor.query('LiteralStringExpression').map(v => v.value)));
  const numbersProgram = Array.from(new Set(refactor.query('LiteralNumericExpression').map(v => v.value)));
  const bindingProperties = Array.from(new Set(refactor.query('AssignmentExpression[binding.type="StaticMemberAssignmentTarget"]').map(v => v.binding.property)));
  const expStatementStr = Array.from(new Set(refactor.query('ExpressionStatement[expression.expression.type="StaticMemberExpression"]').map(exp => exp.expression.expression.property)));
  const staticMemberStr = Array.from(new Set(refactor.query('StaticMemberExpression').map(v => v.property)));

  const staticLiterals = stringsProgram.concat(numbersProgram, bindingProperties, expStatementStr, staticMemberStr);
  // staticLiterals contains the different attributes we want to obfuscate
  const staticLiteralToIndex = new Map(staticLiterals.map((lit, idx) => [lit, idx]);

  refactor.query('Script')[0].statements.unshift(new Shift.VariableDeclarationStatement({
    declaration: new Shift.VariableDeclaration({
      kind: 'const',
      declarators: [new Shift.VariableDeclarator({
        binding: new Shift.BindingIdentifier({
          name: 'members'
        }),
        init: new Shift.ArrayExpression({
          elements: staticLiterals.map((lit) => {
            if (typeof lit === 'string') {
              return new Shift.LiteralStringExpression({
                value: new Buffer.from(lit).toString('base64')
              });
            } else if (typeof lit === 'number') {
              return new Shift.LiteralNumericExpression({
                value: lit
              })
            }
          });
        })
      })
    })
  }));

}
