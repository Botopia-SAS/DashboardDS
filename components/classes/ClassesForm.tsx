"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import ImageUpload from "../custom ui/ImageUpload";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import Select, { MultiValue, ActionMeta } from "react-select";
import useClassTypeStore from "@/app/store/classTypeStore";
import Link from "next/link";

const formSchema = z.object({
  title: z.string().min(2).max(500),
  alsoKnownAs: z.array(z.string().min(1)).default([]),
  length: z.coerce.number().min(0.1, "Must be at least 0.1 hours"),
  price: z.coerce.number().min(0.1, "Price must be greater than 0"),
  overview: z.string().min(10).max(2000),
  objectives: z.array(z.string().min(1)).default([]),
  buttonLabel: z.string().min(1).max(20),
  image: z.string().optional(),
  headquarters: z.array(z.string()).min(1, "Please select at least one headquarters"),
  classType: z.string().default("date"),
});

interface FormProps {
  initialData?: {
    _id: string;
    title: string;
    alsoKnownAs: string[];
    length: number;
    price: number;
    overview: string;
    objectives: string[];
    buttonLabel: string;
    image?: string;
    headquarters?: string[];
    classType?: string;
  } | null;
}

const CustomForm: React.FC<FormProps> = ({ initialData }) => {
  const { availableClassTypes, setAvailableClassTypes, addClassType } = useClassTypeStore();
  const [headquartersOptions, setHeadquartersOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedHeadquarters, setSelectedHeadquarters] = useState<{ label: string; value: string }[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showNewClassTypeForm, setShowNewClassTypeForm] = useState(false);
  const [newClassTypeName, setNewClassTypeName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch locations
        const locationsRes = await fetch("/api/locations");
        if (!locationsRes.ok) throw new Error("Failed to fetch locations");

        const locationsData = await locationsRes.json();

        interface Location {
          zone: string;
        }

        const zones = locationsData.map((location: Location) => ({
          label: location.zone,
          value: location.zone,
        }));

        setHeadquartersOptions(zones);

        // Fetch class types
        const classTypesRes = await fetch("/api/classtypes");
        if (!classTypesRes.ok) throw new Error("Failed to fetch class types");

        const classTypesData = await classTypesRes.json();
        setAvailableClassTypes(classTypesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [setAvailableClassTypes]);

  // ✅ Función para manejar selección en el dropdown
  const handleSelectChange = (newValue: MultiValue<{ label: string; value: string }>, actionMeta: ActionMeta<{ label: string; value: string }>) => {
      const selectedValues = newValue.map((hq) => hq.value);
      console.log(actionMeta)
      form.setValue("headquarters", selectedValues);
      setSelectedHeadquarters(newValue as { label: string; value: string }[]);
    };

  // ✅ Función para manejar "Seleccionar Todos"
  const handleSelectAll = () => {
    if (selectAll) {
      form.setValue("headquarters", []); // Vacía el formulario
      setSelectedHeadquarters([]);
    } else {
      const allValues = headquartersOptions.map((hq) => hq.value);
      form.setValue("headquarters", allValues);
      setSelectedHeadquarters(headquartersOptions);
    }
    setSelectAll(!selectAll);
  };

  // ✅ Función para agregar nuevo classType
  const handleAddNewClassType = async () => {
    try {
      if (!newClassTypeName.trim()) {
        toast.error("Class type name is required");
        return;
      }

      const res = await fetch("/api/classtypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassTypeName.trim() }),
      });

      if (res.ok) {
        const createdClassType = await res.json();
        addClassType(createdClassType);
        setNewClassTypeName("");
        setShowNewClassTypeForm(false);
        toast.success("Class type added successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to add class type");
      }
    } catch (error) {
      console.error("Error adding class type:", error);
      toast.error("Something went wrong!");
    }
  };

  // ✅ Función para obtener el ID mostrado según classType
  const getDisplayId = (classType: string) => {
    const type = availableClassTypes.find(ct => ct.name === classType);
    return type ? type.name.toUpperCase() : classType.toUpperCase();
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      alsoKnownAs: initialData?.alsoKnownAs ?? [],
      length: initialData?.length ?? 1,
      price: initialData?.price ?? 0.1,
      overview: initialData?.overview || "",
      objectives: initialData?.objectives ?? [],
      contact: initialData?.contact || "",
      buttonLabel: initialData?.buttonLabel || "",
      image: initialData?.image || "",
      headquarters: initialData?.headquarters ?? [], // ✅ Asegura que sea un array
      classType: initialData?.classType ?? "date",
    },
  });

  // 📌 Cargar las headquarters seleccionadas cuando `initialData` esté disponible
  useEffect(() => {
    if (initialData?.headquarters && headquartersOptions.length > 0) {
      const selected = headquartersOptions.filter(hq =>
         initialData.headquarters?.includes(hq.value)
        );
      setSelectedHeadquarters(selected);
      form.setValue("headquarters", selected.map(hq => hq.value)); // ✅ Sincroniza el formulario
    }
  }, [initialData, headquartersOptions, form]); // 🚀 Se ejecuta cuando `initialData` y `headquartersOptions` cambian

  // 📌 Sincronizar classType cuando se cargan los datos
  useEffect(() => {
    if (initialData?.classType && availableClassTypes.length > 0) {
      // Buscar el classType que coincida
      const matchingType = availableClassTypes.find(ct =>
        ct.name === initialData.classType
      );

      if (matchingType) {
        form.setValue("classType", matchingType.name);
      } else {
        // Si no existe, usar el primer disponible
        if (availableClassTypes.length > 0) {
          form.setValue("classType", availableClassTypes[0].name);
        }
      }
    }
  }, [initialData, availableClassTypes, form]);

  // 📌 Guardar datos originales para comparación
  useEffect(() => {
    if (initialData && !originalData) {
      setOriginalData({
        title: initialData.title || "",
        alsoKnownAs: initialData.alsoKnownAs || [],
        length: initialData.length || 1,
        price: initialData.price || 0.1,
        overview: initialData.overview || "",
        objectives: initialData.objectives || [],
        contact: initialData.contact || "",
        buttonLabel: initialData.buttonLabel || "",
        image: initialData.image || "",
        headquarters: initialData.headquarters || [],
        classType: initialData.classType || "date",
      });
    }
  }, [initialData, originalData]);

  // 📌 Detectar cambios en tiempo real
  const currentValues = form.watch();
  useEffect(() => {
    if (initialData && originalData) {
      const currentData = {
        ...currentValues,
        headquarters: form.getValues("headquarters"),
      };

      const hasChanged = JSON.stringify(originalData) !== JSON.stringify(currentData);
      setHasChanges(hasChanged);

      if (hasChanged) {
        console.log("[DEBUG] Changes detected:", {
          original: originalData,
          current: currentData
        });
      }
    }
  }, [currentValues, originalData, initialData, form]);

  const router = useRouter();

  // 📌 Función para guardar directamente
  const handleSave = async () => {
    if (!hasChanges || !initialData) {
      toast.success("No changes to save");
      return;
    }

    try {
      setIsLoading(true);
      const currentValues = form.getValues();

      console.log("[SAVE_DEBUG] Current form values:", currentValues);
      console.log("[SAVE_DEBUG] Saving to ID:", initialData._id);
      console.log("[SAVE_DEBUG] Original data:", originalData);
      
      // Log specific fields you're changing
      console.log("[SAVE_DEBUG] ClassType field:", currentValues.classType);
      console.log("[SAVE_DEBUG] Length field:", currentValues.length);
      console.log("[SAVE_DEBUG] Price field:", currentValues.price);

      // Validate required fields before sending
      if (!currentValues.title || !currentValues.overview || !currentValues.contact || !currentValues.buttonLabel) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!currentValues.length || currentValues.length <= 0) {
        toast.error("Length must be greater than 0");
        return;
      }

      if (!currentValues.price || currentValues.price <= 0) {
        toast.error("Price must be greater than 0");
        return;
      }

      const payload = {
        ...currentValues,
        headquarters: form.getValues("headquarters"),
        classType: currentValues.classType || "date", // Usar fallback solo si está vacío
      };

      console.log("[SAVE_DEBUG] Final payload:", payload);
      console.log("[SAVE_DEBUG] Payload ClassType:", payload.classType);
      console.log("[SAVE_DEBUG] Payload Length:", payload.length);
      console.log("[SAVE_DEBUG] Payload Price:", payload.price);

      const res = await fetch(`/api/classes/${initialData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[SAVE_DEBUG] Response status:", res.status);

      if (res.ok) {
        const responseText = await res.text();
        console.log("[SAVE_DEBUG] Raw response:", responseText);
        
        let updatedData;
        try {
          updatedData = JSON.parse(responseText);
          console.log("[SAVE_DEBUG] Parsed response:", updatedData);
        } catch (parseError) {
          console.error("[SAVE_DEBUG] JSON parse error:", parseError);
          toast.error("Invalid response from server");
          return;
        }
        
        if (updatedData.success) {
          console.log("[SAVE_DEBUG] Updated successfully:", updatedData.data);
          console.log("[SAVE_DEBUG] Server confirmed ClassType:", updatedData.data?.classType);
          console.log("[SAVE_DEBUG] Server confirmed Length:", updatedData.data?.length);
          console.log("[SAVE_DEBUG] Server confirmed Price:", updatedData.data?.price);
          
          toast.success("Class updated successfully!");
          setHasChanges(false);
          
          // Actualizar originalData con los datos del servidor
          setOriginalData({
            ...updatedData.data,
            headquarters: updatedData.data.headquarters || form.getValues("headquarters"),
          });

          // Redirigir a la lista de clases después de 1 segundo
          setTimeout(() => {
            router.push("/classes");
          }, 1000);
        } else {
          console.error("[SAVE_DEBUG] Server returned success: false:", updatedData);
          toast.error(updatedData.message || "Failed to save changes");
        }
      } else {
        let errorMessage = "Failed to save changes";
        try {
          const errorData = await res.json();
          console.error("[SAVE_DEBUG] Error response:", errorData);
          errorMessage = errorData.message || errorMessage;
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(", ");
          }
        } catch (jsonError) {
          console.error("[SAVE_DEBUG] Error parsing error response:", jsonError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("[SAVE_DEBUG] Save error:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      console.log("[DEBUG] Form values recibidos:", values);
      console.log("[DEBUG] Current classType in form:", form.getValues("classType"));
      console.log("[DEBUG] initialData:", initialData);

      const url = initialData ? `/api/classes/${initialData._id}` : "/api/classes";
      const method = initialData ? "PUT" : "POST";

      const payload = {
        ...values,
        headquarters: form.getValues("headquarters"), // ✅ Envía como array
        classType: values.classType, // No usar fallback que puede sobrescribir el valor seleccionado
      };

      console.log("[DEBUG] Payload final:", payload);
      console.log("[DEBUG] URL:", url);
      console.log("[DEBUG] Method:", method);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[DEBUG] Response status:", res.status);

      if (res.ok) {
        const responseText = await res.text();
        console.log("[DEBUG] Raw response:", responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log("[DEBUG] Parsed response:", responseData);
        } catch (parseError) {
          console.error("[DEBUG] JSON parse error:", parseError);
          toast.error("Invalid response from server");
          return;
        }
        
        if (responseData.success !== false) {
          toast.success(`Class ${initialData ? "updated" : "created"} successfully`);
          router.push("/classes");
        } else {
          console.error("[DEBUG] Server returned success: false:", responseData);
          toast.error(responseData.message || "Failed to submit form");
        }
      } else {
        let errorMessage = "Failed to submit form";
        try {
          const errorData = await res.json();
          console.error("[DEBUG] Error response:", errorData);
          errorMessage = errorData.message || errorMessage;
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(", ");
          }
        } catch (jsonError) {
          console.error("[DEBUG] Error parsing error response:", jsonError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("[DEBUG] Fetch error:", error);
      toast.error("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className="p-10 mx-auto bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">
          {initialData ? "Edit Driving Class" : "Create New Driving Class"}
        </h1>

        {/* SEO Button - Solo visible si hay initialData (modo edición) */}
        {initialData && (
          <Link href={`/classes/${initialData._id}/seo`}>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold px-4 py-2"
            >
              SEO Settings
            </Button>
          </Link>
        )}
      </div>
      <Separator className="bg-gray-300 my-4" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* 🔹 TITLE */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 CLASS TYPE */}
          <FormField
            control={form.control}
            name="classType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class Type</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <select
                      {...field}
                      onChange={(e) => {
                        console.log("[DEBUG] ClassType changed to:", e.target.value);
                        field.onChange(e);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableClassTypes.map((classType) => (
                        <option key={classType._id} value={classType.name}>
                          {classType.name.toUpperCase()}
                        </option>
                      ))}
                      {availableClassTypes.length === 0 && (
                        <option value="date">Loading...</option>
                      )}
                    </select>

                    {/* Mostrar ID correspondiente */}
                    <div className="text-sm text-gray-600">
                      <strong>ID:</strong> {getDisplayId(field.value)}
                    </div>

                    {/* Botón para agregar nuevo classType */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewClassTypeForm(!showNewClassTypeForm)}
                      className="w-full"
                    >
                      {showNewClassTypeForm ? "Cancel" : "+ Add New Class Type"}
                    </Button>

                    {/* Formulario para nuevo classType */}
                    {showNewClassTypeForm && (
                      <div className="border p-4 rounded-md bg-gray-50 space-y-3">
                        <div>
                          <label className="block text-sm font-medium">New Class Type</label>
                          <Input
                            placeholder="e.g. CDA"
                            value={newClassTypeName}
                            onChange={(e) => setNewClassTypeName(e.target.value)}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleAddNewClassType}
                            className="bg-green-600 text-white"
                          >
                            Add Class Type
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowNewClassTypeForm(false);
                              setNewClassTypeName("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 ALSO KNOWN AS */}
          <FormItem>
            <FormLabel className="pr-4">Also known as</FormLabel>
            {form.watch("alsoKnownAs").map((alias, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={alias}
                  onChange={(e) => {
                    const newAliases = [...form.getValues("alsoKnownAs")];
                    newAliases[index] = e.target.value;
                    form.setValue("alsoKnownAs", newAliases);
                  }}
                  placeholder="Enter alias"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newAliases = form.getValues("alsoKnownAs").filter((_, i) => i !== index);
                    form.setValue("alsoKnownAs", newAliases);
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => form.setValue("alsoKnownAs", [...form.getValues("alsoKnownAs"), ""])}
              className="mt-2 bg-blue-500 text-white"
            >
              + Add Also Know As
            </Button>
          </FormItem>

          {/* 🔹 HEADQUARTERS */}
          <FormItem>
            <FormLabel>Headquarters Available</FormLabel>
            <div className="flex flex-col gap-2">

              {/* ✅ Checkbox para seleccionar todos */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                <span>Select All</span>
              </label>

              {/* ✅ Multi-Select Dropdown */}
              <Select
                isMulti
                options={headquartersOptions}
                value={selectedHeadquarters}
                onChange={handleSelectChange}
                placeholder="Select locations..."
                className="w-full"
              />
            </div>
            <FormMessage />
          </FormItem>


          {/* 🔹 LENGTH */}
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (hours)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="Enter length" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 PRICE */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="Enter price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 OVERVIEW */}
          <FormField
            control={form.control}
            name="overview"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overview</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter overview" rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 🔹 OBJECTIVES */}
          <FormItem>
            <FormLabel className="pr-4">Objectives</FormLabel>
            {form.watch("objectives").map((objective, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={objective}
                  onChange={(e) => {
                    const newObjectives = [...form.getValues("objectives")];
                    newObjectives[index] = e.target.value;
                    form.setValue("objectives", newObjectives);
                  }}
                  placeholder="Enter objective"
                />
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const newObjectives = form.getValues("objectives").filter((_, i) => i !== index);
                    form.setValue("objectives", newObjectives);
                  }}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              onClick={() => form.setValue("objectives", [...form.getValues("objectives"), ""])}
              className="mt-2 bg-blue-500 text-white"
            >
              + Add Objective
            </Button>
          </FormItem>



          {/* 🔹 IMAGE UPLOAD */}
          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ? [field.value] : []}
                    onChange={(url) => field.onChange(url)}
                    onRemove={() => field.onChange("")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 🔹 BUTTON LABEL */}
          <FormField
            control={form.control}
            name="buttonLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Button Label</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter button label" maxLength={20} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

      {/* 🔹 BUTTONS */}
      <div className="flex gap-4">
        {/* Botón Save solo para edición */}
        {initialData && (
          <Button
            type="button"
            onClick={handleSave}
            className={`${hasChanges ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white transition-colors`}
            disabled={isLoading || !hasChanges}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                💾 Save Changes
                {hasChanges && <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>}
              </div>
            )}
          </Button>
        )}            {/* Botón Submit original para creación */}
            {!initialData && (
              <Button
                type="submit"
                className="bg-blue-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Creating...
                  </div>
                ) : (
                  "Create Class"
                )}
              </Button>
            )}

            <Button
              type="button"
              onClick={() => router.push("/classes")}
              className="bg-gray-500 text-white"
              disabled={isLoading}
            >
              {hasChanges ? "Discard Changes" : "Back to Classes"}
            </Button>
          </div>

          {/* Indicador de cambios */}
          {initialData && hasChanges && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 flex items-center gap-2">
                ⚠️ You have unsaved changes
              </p>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
};

export default CustomForm;

