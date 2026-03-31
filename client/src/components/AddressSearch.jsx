import React, { useState } from "react";

const AddressSearch = ({ onAddressSelect }) => {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = async (value) => {
    setAddress(value);
    if (value.length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${value}`,
        );
        const data = await response.json();
        setSuggestions(data.slice(0, 5));
      } catch (error) {
        console.error("Search error:", error);
      }
    }
  };

  const handleSelect = (suggestion) => {
    setAddress(suggestion.display_name);
    setSuggestions([]);
    onAddressSelect({
      address: suggestion.display_name,
      coordinates: [parseFloat(suggestion.lon), parseFloat(suggestion.lat)],
    });
  };

  return (
    <div className="address-search">
      <input
        type="text"
        value={address}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search address..."
        className="search-input"
      />
      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion, idx) => (
            <li key={idx} onClick={() => handleSelect(suggestion)}>
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AddressSearch;
