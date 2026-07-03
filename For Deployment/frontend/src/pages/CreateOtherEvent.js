import React from "react";
import BaseEventForm from "./BaseEventForm";

function CreateOtherEvent() {
  const fields = [
    {
      name: "eventType",
      label: "Event Type",
      type: "text",
      placeholder: "e.g., Meetup, Gathering, Social Event",
      required: true
    },
    {
      name: "organizerName",
      label: "Organizer/Host Name",
      type: "text",
      placeholder: "e.g., Community Group, Organization",
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
      placeholder: "e.g., Community Center, Park",
      required: true
    },
    {
      name: "timing",
      label: "Event Timing",
      type: "text",
      placeholder: "e.g., 05:00 PM - 09:00 PM",
      required: true
    },
    {
      name: "totalSeats",
      label: "Total Available Seats",
      type: "number",
      placeholder: "e.g., 100",
      required: true,
      min: "1"
    },
    {
      name: "price",
      label: "Ticket Price (₹) (0 for free)",
      type: "number",
      placeholder: "e.g., 0 for free, 499 for paid",
      required: true,
      min: "0",
      step: "0.01"
    }
  ];

  return (
    <BaseEventForm
      category="other"
      categoryIcon="🎯"
      title="Other Event"
      fields={fields}
    />
  );
}

export default CreateOtherEvent;