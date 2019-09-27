import React from 'react';
import Scroll from './ComponentWithScrollLoad/ScrollItem';
// import Scroll from './ScrollLoadHooks';
// import Scroll from './ScrollLoadNew';
// import Scroll from './ScrollLoadSimple';

import './App.css';

const domNum = 20;

const App = () => (
  <div className="app">
    {
      Array.from(
        { length: domNum },
        (text, index) => (
          <Scroll text={`第${index + 1}个元素`} />
        )
      )
    }
  </div>
);

export default App;
