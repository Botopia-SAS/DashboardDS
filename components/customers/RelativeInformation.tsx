/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function RelativeInformation({
  form,
  courseType,
}: {
  form: any;
  courseType: string;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name="courseType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Course Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger value={courseType}>
                  <SelectValue placeholder="Select a course type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-white">
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="bdi">BDI</SelectItem>
                <SelectItem value="adi">ADI</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {courseType === "bdi" && (
        <>
          <FormField
            control={form.control}
            name="bdi_subtype"
            render={({ field }) => (
              <FormItem>
                <FormLabel>BDI Subtype</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a BDI subtype" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="bdi">BDI</SelectItem>
                    <SelectItem value="4h c.o">4h C.O</SelectItem>
                    <SelectItem value="8h c.o">8h C.O</SelectItem>
                    <SelectItem value="agressive">Agressive</SelectItem>
                    <SelectItem value="tcac ordered">TCAC Ordered</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bdi_reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for BDI</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white">
                    <SelectItem value="BDI Insurance">BDI Insurance</SelectItem>
                    <SelectItem value="BDI Hwy Racing Spectator">
                      BDI Hwy Racing Spectator
                    </SelectItem>
                    <SelectItem value="BDI Election">BDI Election</SelectItem>
                    <SelectItem value="BDI for TCAC">BDI for TCAC</SelectItem>
                    <SelectItem value="BDI Court Ordered">
                      BDI Court Ordered
                    </SelectItem>
                    <SelectItem value="BDI Reckless Driving">
                      BDI Reckless Driving
                    </SelectItem>
                    <SelectItem value="BDI Red light running">
                      BDI Red light running
                    </SelectItem>
                    <SelectItem value="BDI Passing School Bus">
                      BDI Passing School Bus
                    </SelectItem>
                    <SelectItem value="BDI for Highway Racing">
                      BDI for Highway Racing
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {courseType === "adi" ||
        (courseType == "bdi" && (
          <>
            <FormField
              control={form.control}
              name="citation_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Citation Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Citation Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="case_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Case Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country_ticket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Ticket</FormLabel>
                  <FormControl>
                    <Input placeholder="Country Ticket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="course_country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Country</FormLabel>
                  <FormControl>
                    <Input placeholder="Course Country" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ))}

      {courseType === "adi" && (
        <FormField
          control={form.control}
          name="adi_reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for ADI</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  <SelectItem value="3 crashes in 3 years">
                    3 crashes in 3 years
                  </SelectItem>
                  <SelectItem value="ADI for Points">ADI for Points</SelectItem>
                  <SelectItem value="adi for HTO">ADI for HTO</SelectItem>
                  <SelectItem value="ADI Court Ordered">
                    ADI Court Ordered
                  </SelectItem>
                  <SelectItem value="ADI Department required">
                    ADI Department required
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}
