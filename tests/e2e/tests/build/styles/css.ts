import * as fs from 'fs';

import {writeMultipleFiles, expectFileToMatch} from '../../../utils/fs';
import {ng} from '../../../utils/process';
import {updateJsonFile} from '../../../utils/project';


export default function() {
  return writeMultipleFiles({
    'src/styles.css': `
      @import './imported-styles.css';

      body { background-color: blue; }
    `,
    'src/imported-styles.css': `
      p { background-color: red; }
    `,
    'src/styles.less': `
        .outer {
          .inner {
            background: #fff;
          }
        }
    `,
    'src/styles.scss': `
        .upper {
          .lower {
            background: #def;
          }
        }
    `
  })
    .then(() => updateJsonFile('angular-cli.json', configJson => {
      const app = configJson['apps'][0];
      app['styles'].push('src/styles.less');
      app['styles'].push('src/styles.scss');
    }))
    .then(() => ng('build'))
    .then(() => expectFileToMatch('dist/styles.bundle.js', 'body { background-color: blue; }'))
    .then(() => expectFileToMatch('dist/styles.bundle.js', 'p { background-color: red; }'))
    .then(() => expectFileToMatch('dist/styles.bundle.js', /.outer.*.inner.*background:\s*#[fF]+/))
    .then(() => expectFileToMatch('dist/styles.bundle.js', /.upper.*.lower.*background.*#def/))

    .then(() => ng('build', '--prod'))
    .then(() => new Promise<string>((resolve, reject) => {
      fs.readdir('dist', (err, files) => {
        if (err) {
          reject(err);
        } else {
          const styles = files.find(file => /styles\.[0-9a-f]{20}\.bundle\.css/.test(file));
          resolve(styles);
        }
      });
    }))
    .then((styles) =>
      expectFileToMatch(styles, 'body { background-color: blue; }')
        .then(() => expectFileToMatch(styles, 'p { background-color: red; }')
        .then(() => expectFileToMatch(styles, /.outer.*.inner.*background:\s*#[fF]+/))
        .then(() => expectFileToMatch(styles, /.upper.*.lower.*background.*#def/)))
    );
}
