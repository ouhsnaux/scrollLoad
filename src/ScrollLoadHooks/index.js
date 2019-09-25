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
