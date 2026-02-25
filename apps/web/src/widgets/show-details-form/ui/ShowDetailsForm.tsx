import { ScheduleCard } from "./ScheduleCard";
import { ShowCard } from "./ShowCard";
import { VenueCard } from "./VenueCard";

export function ShowDetailsForm() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 xl:space-y-8">
      <ShowCard />
      <ScheduleCard />
      <VenueCard />
    </div>
  );
}
