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
