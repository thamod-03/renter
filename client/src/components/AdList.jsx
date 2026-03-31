import React from "react";
import AdCard from "./AdCard";

const AdList = ({ ads, loading, error }) => {
  if (loading) {
    return <div className="loading">Loading ads...</div>;
  }

  if (error) {
    return <div className="error">Error loading ads: {error}</div>;
  }

  if (!ads || ads.length === 0) {
    return <div className="no-results">No ads found</div>;
  }

  return (
    <div className="ad-list">
      {ads.map((ad) => (
        <AdCard key={ad._id} ad={ad} />
      ))}
    </div>
  );
};

export default AdList;
