import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateSportsEvent() {
  const fields = [
    {
      name: "sportType",
      label: "Sport Type",
      type: "text",
      placeholder: "e.g., Cricket, Football, Tennis",
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
      label: "Stadium/Venue",
      type: "text",
      placeholder: "e.g., Wankhede Stadium, Mumbai",
      required: true
    },
    {
      name: "timing",
      label: "Match Timing",
      type: "text",
      placeholder: "e.g., 03:30 PM - 11:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 25000",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹)",
      type: "number",
      placeholder: "e.g., 499",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="sports"
      categoryIcon="⚽"
      title="Sports Event"
      fields={fields}
    />
  );
}

export default CreateSportsEvent;