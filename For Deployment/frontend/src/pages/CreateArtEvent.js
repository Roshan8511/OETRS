import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateArtEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Exhibition, Workshop, Performance",
      required: true
    },
    {
      name: "artistName",
      label: "Artist/Host Name",
      type: "text",
      placeholder: "e.g., MF Husain, Contemporary Artist",
      required: true
    },
    {
      name: "startDate",
      label: "Start Date",
      type: "date",
      placeholder: "Select start date",
      required: true
    },
    {
      name: "endDate",
      label: "End Date",
      type: "date",
      placeholder: "Select end date",
      required: true
    },
    {
      name: "location",
      label: "Venue",
      type: "text",
      placeholder: "e.g., Art Gallery, Cultural Center",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 11:00 AM - 07:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 150",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 799 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="art"
      categoryIcon="🎨"
      title="Art Event"
      fields={fields}
    />
  );
}

export default CreateArtEvent;