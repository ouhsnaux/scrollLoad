## 前言
项目中有两个页面有很多Echarts画的图，进去的时候特别卡，使用了滚动加载之后流畅很多，用户体验大幅提升。
另外滚动加载还有很多其他用途，比如：滚动翻页，无线翻滚，图片出现在视口才请求。。。  
[附上 github 链接](https://github.com/ouhsnaux/scrollLoad)   
本文的内容
1. 传统方案实现滚动加载
2. H5 API IntersectionObserver实现滚动加载
3. 第二种方案使用Hooks实现

## 1. 传统方案
传统方案实现滚动加载流程：
```
  * 展示Loading...
  * 判断该元素是否在视口中，是则展示真正的内容，否则进行下一步
  * 递归获取滚动容器
  * 给滚动容器添加滚动事件
  * 当元素出现在视口中时，开始展示真正的内容，并取消监控事件
```
### 1.1 创建容器
index.js文件直接使用项目初始化的代码，
更改app.js创建容器
``` javascript
import React from 'react';
import Scroll from './ScrollLoadSimple';

import './App.css';

const domNum = 20;

const App = () => {
  return (
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
}

export default App;

```
### 1.2展示Loading
创建ScrollLoadSimple文件夹，并创建index.js
在滚动加载的组件中我们需要在state中添加一个字段表示正在加载中，不妨使用loading。  
index.js
``` javascript
import  React from 'react';

class ScrollLoad extends React.Component {
  state = { loading: true }

  render() {
    const { loading } = this.state;
    const { text } = this.props;
    return (
      <div className="scrollitem">
        {
          loading ? 'Loading...' : text
        }
      </div>
    )
  }
}

export default ScrollLoad;
```
style.css
``` css
.scrollitem {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;

  border: 1px solid green;
  margin-top: 10px;
}

.scrollitem:first-child {
  margin-top: 0;
}
```
### 1.3 判断元素是否出现在视口中
判断元素是否出现在视口中也有两种方案，一种是最基本的方案，使用offsetTop计算body元素到该元素的距离，计算比较繁琐，容易出问题，另一种方案比较简单，使用getboundingclientrect计算元素是否出现在视口中。
### 1.3.1 基本方案 通过offsetTop计算元素是否出现在视口中
*这种计算方案极力不推荐，计算繁琐，并且滚动容器嵌套的话还可能有问题。*  
首先获取该元素的offsetTop，  
然后递归获取父元素的offsetTop，相加之后的和就是视口左上角到该元素的距离， 
接着获取滚动容器，通过scrollTop获取滚动高度，滚动容器的条件是scrollHeight > clientHeight。当没有父元素满足该条件时返回null,此时计算滚动高度使用`document.scrollingElement.scrollTop`，在chrome中`document.scrollingElement`是`html`，同时也是`document.documentElement`。  
通过对比屏幕高度+滚动高度与该距离就能得知元素是否出现在视口中。  
这里有个坑就是offsetTop是根据position为relative的祖先元素或body来计算的，  
假设A元素的position为relative，  
B元素的position不是relative，B元素的父节点是A元素，offsetTop为36，  
C节点为B元素的子节点，并且顶部与B元素重合，则C元素的offsetTop也是36，  
因此递归获取offsetTop时，只能使用position为relative的祖先元素。 
![](https://user-gold-cdn.xitu.io/2019/9/25/16d6846dbc5536ea?imageView2/2/w/480/h/480/q/85/interlace/1)
``` javascript
import React from 'react';
import './style.css';

class ScrollLoad extends React.Component {
  state = { loading: true }
  ref = React.createRef();

  componentDidMount() {
    const node = this.ref.current;
    this.scrollParent = this.getScrollParent(node);
    if (this.checkVisible(node)) {
      this.setState({ loading: false });
    }
  }

  getScrollParent = (node) => {
    if (!node || node.parentNode === document.documentElement) {
      return null;
    }
    const parentNode = node.parentNode;
    if (parentNode.scrollHeight > parentNode.clientHeight
      || parentNode.scrollWidth > parentNode.clientWidth
    ) {
      return parentNode;
    }
    return this.getScrollParent(parentNode);
  }

  checkVisible = (node) => {
    let offsetTop = node.offsetTop;
    let offsetLeft = node.offsetLeft;
    let parentNode = node.parentNode;
    while (parentNode && parentNode !== document.body) {
      if (getComputedStyle(parentNode).position === 'relative') {
        offsetTop += parentNode.offsetTop;
        offsetLeft += parentNode.offsetLeft;
      }
      parentNode = parentNode.parentNode;
    }
    // 滚动元素在最外层时，计算scrollTop要使用scrollingElement
    const scrollParent = this.scrollParent || document.scrollingElement;
    return window.innerHeight + scrollParent.scrollTop > offsetTop
      && window.innerWidth + scrollParent.scrollLeft > offsetLeft;
  }

  render() {
    const { loading } = this.state;
    const { text } = this.props;
    return (
      <div className="scrollitem" ref={this.ref}>
        {
          loading ? 'Loading...' : text
        }
      </div>
    )
  }
}

export default ScrollLoad;
```
![](https://user-gold-cdn.xitu.io/2019/9/25/16d684b947fb7a09?w=1531&h=753&f=png&s=201004)
### 1.3.2 使用getboundingclientrect计算是否出现在视口中
使用getBoundingClientRect可以获得节点相对于视口的信息。  
![](https://user-gold-cdn.xitu.io/2019/9/25/16d684f1ec797af9?w=1140&h=540&f=png&s=6096)
重写`checkVisible`函数
```javascript
  checkVisible = (node) => {
    if (node) {
      const { top, bottom, left, right } = node.getBoundingClientRect();
      return bottom > 0 
        && top < window.innerHeight
        && left < window.innerWidth
        && right > 0;
    }
    return false;
  }
```
超级简单。

### 1.4 获取滚动容器
在1.3.1节中`getScrollTop`函数就是为了获取滚动容器的，这里不再赘述。
### 1.5 添加滚动事件
当有元素未出现在视口中时，要监听滚动容器的滚动事件，
修改didMount
```javascript
  componentDidMount() {
    const node = this.ref.current;
    this.scrollParent = this.getScrollParent(node);
    if (this.checkVisible(node)) {
      this.setState({ loading: false });
    } else {
      this.addEvent();
    }
  }
```
添加滚动事件，当没有滚动容器时，要在window上添加滚动事件。  
当容器开始滚动时，判断是否出现在视口中，如果出现了，则展示真正的内容，并取消监听事件。  
由于滚动事件触发频率特别高，所以要使用节流函数，这里使用lodash的节流函数。
下面看代码
`import throttle from 'lodash/throttle';`

``` js
  onScroll = throttle(() => {
    const node = this.ref.current;
    if (this.checkVisible(node)) {
      this.setState({ loading: false });
      this.cancelEvent();
    }
  }, 200)

  addEvent = () => {
    // 滚动元素在最外层时，要在window上添加滚动事件
    const scrollParent = this.scrollParent || window;
    scrollParent.addEventListener('scroll', this.onScroll);
  }

  cancelEvent = () => {
    const scrollParent = this.scrollParent || window;
    scrollParent.removeEventListener('scroll', this.onScroll);
  }
```
最后，不要忘记了在willUnmount中取消监听
``` js
  componentWillUnmount() {
    this.cancelEvent();
  }
```

![](https://user-gold-cdn.xitu.io/2019/9/25/16d6852bed691e01?w=1906&h=900&f=gif&s=890415)
## 2. 使用H5 API IntersectionObserver
### 2.1 如何实现
直接上代码
```js
import React from 'react';
import './style.css';

class ScrollLoad extends React.Component {
  state = { loading: true }
  ref = React.createRef();

  componentDidMount() {
    const node = this.ref.current;
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.setState({ loading: false });
          observer.unobserve(node);
        }
      })
    });
    this.observer.observe(node);
  }

  componentWillUnmount() {
    this.observer.disconnect();
  }

  render() {
    const { loading } = this.state;
    const { text } = this.props;
    return (
      <div className="scrollitem" ref={this.ref}>
        {
          loading ? 'Loading...' : text
        }
      </div>
    )
  }
}

export default ScrollLoad;
```
优点：IntersectionObserver优先度极低，消耗性能也就很低，并且不需要做很多判断，代码量少，逻辑简单。  
IntersectionObserver能实现的功能还有很多。  
但是兼容性还有点问题，可以使用[polyfill](https://www.npmjs.com/package/intersection-observer)。

### 2.2 Hooks版本
```js
import React from 'react';
import './style.css';

const ScrollLoad = ({ text }) => {
  const [loading, setLoading] = React.useState(true);
  const ref = React.createRef();
  React.useEffect(() => {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setLoading(false);
          observer.unobserve(entry.target);
        }
      });
    });
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    }
  });
  return (
    <div className="scrollitem" ref={ref}>
      {
        loading ? 'Loading...' : text
      }
    </div>
  )
}

export default ScrollLoad;
```

## 3. 代码复用
### 3.1 高阶组件代码复用
```js
const ComponentWithScrollLoad = (Component) => {
  return class extends React.Component {
    state = { loading: true }
    ref = React.createRef();

    componentDidMount() {
      const node = this.ref.current;
      this.observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.setState({ loading: false });
            observer.unobserve(node);
          }
        })
      });
      this.observer.observe(node);
    }

    componentWillUnmount() {
      this.observer.disconnect();
    }

    render() {
      const { loading } = this.state;
      if (loading) {
        const loadingText = this.props.Loading || 'loading';
        return (
          <div ref={this.ref}>{loadingText}</div>
        )
      }
      return <Component {...this.props} />
    }
  }
} 
```
使用方式：
```js
import React from 'react';
import './style.css';

import ComponentWithScrollLoad from './ComponentWithScrollLoad';
const Component = ({ text }) => <div className="scrollitem">{text}</div>
export default ComponentWithScrollLoad(Component);
```
### 3.2 render props 代码复用
```js

class ScrollLoad extends React.Component {
  state = { loading: true }
  ref = React.createRef();

  componentDidMount() {
    const node = this.ref.current;
    this.observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.setState({ loading: false });
          observer.unobserve(node);
        }
      })
    });
    this.observer.observe(node);
  }

  componentWillUnmount() {
    this.observer.disconnect();
  }

  render() {
    const { loading } = this.state;
    if (loading) {
      const loadingText = this.props.Loading || 'loading';
      return (
        <div ref={this.ref}>{loadingText}</div>
      )
    }
    return this.props.children;
  }
}
```
使用方式
```js
import ScrollLoad from './ScrollLoad';
const Component = ({ text }) => (
  <ScrollLoad>
    <div className="scrollitem">{text}</div>
  </ScrollLoad>
);
export default Component;
```
### 3.3 usehooks
useLoading.js
```js
import React from 'react';

const useLoading = (ref) => {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (!ref.current) {
      return () => { }
    }
    const node = ref.current;
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setLoading(false);
          observer.unobserve(entry.target);
        }
      });
    });
    if (node != null) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
    }
  }, [ref]);
  return loading;
}

export default useLoading;
```
使用方式：
```js
import useLoading from './useLoading';

const Component = ({ text }) => {
  const ref = React.useRef(null);
  const loading = useLoading(ref);
  return (
    <div className="scrollitem" ref={ref}>{loading ? 'loading' : text}</div>
  )
}

export default Component;
```