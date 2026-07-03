import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateFoodEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Food Festival, Cooking Class, Tasting",
      required: true
    },
    {
      name: "chefName",
      label: "Chef/Host Name",
      type: "text",
      placeholder: "e.g., Chef Sanjeev Kapoor",
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
      placeholder: "e.g., Convention Center, Food Court",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 12:00 PM - 09:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 200",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 1499 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="food"
      categoryIcon="🍕"
      title="Food Event"
      fields={fields}
    />
  );
}

export default CreateFoodEvent;