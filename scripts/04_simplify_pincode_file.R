library(tidyverse)
library(here)
library(sf)
library(rmapshaper)
read_gzipped_geojson <- function(gz_file_path) {
    # Create a connection to the gzipped file
    con <- gzcon(file(gz_file_path, "rb"))

    # Read the content and close the connection
    geojson_content <- readLines(con, warn = FALSE)
    close(con)

    # Collapse the lines into a single string
    geojson_str <- paste(geojson_content, collapse = "")

    # Write to a temporary file
    temp_file <- tempfile(fileext = ".geojson")
    writeLines(geojson_str, temp_file)

    # Read with sf
    sf_object <- read_sf(temp_file)

    # Clean up
    file.remove(temp_file)

    return(sf_object)
}

pincode.map <- read_gzipped_geojson("~/github/misc_projects/37_india_pincode_boundary/All_India_pincode_Boundary-19312.geojson.gz")

pincode.map$Division <- trimws(pincode.map$Division)
pincode.map$Circle <- trimws(pincode.map$Circle)
pincode.map$Office_Name <- trimws(pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "S\\.O\\.", replacement = "SO", x = pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "S\\.O", replacement = "SO", x = pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "SO\\.", replacement = "SO", x = pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "H\\.O\\.", replacement = "HO", x = pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "H\\.O", replacement = "HO", x = pincode.map$Office_Name)
pincode.map$Office_Name <- gsub(pattern = "HO\\.", replacement = "HO", x = pincode.map$Office_Name)

pincode_dist <- pincode.map %>%
    select(Pincode, Circle, Division,Office_Name) %>%
    as.data.frame() %>%
    select(Pincode, Circle, Division,Office_Name) %>%
    arrange(Pincode, Circle, Division,Office_Name) %>%
    unique()
write.csv(pincode_dist,
          here("public/India_Pincode_list.csv"),
          row.names = FALSE
)
unique(st_geometry_type(pincode.map))
# pincode.map <- pincode.map %>%
#     mutate(
#         geometry = map(geometry, function(geom) {
#             if (st_geometry_type(geom) == "MULTIPOLYGON") {
#                 # Convert MULTIPOLYGON to GEOMETRYCOLLECTION
#                 polygons <- st_cast(geom, "POLYGON")
#                 geom_list <- as.list(polygons)
#                 return(st_geometrycollection(geom_list))
#             } else {
#                 return(geom)
#             }
#         })
#     ) %>%
#     st_drop_geometry() %>%
#     bind_cols(
#         geometry = st_sfc(unlist(.$geometry, recursive = FALSE), crs = st_crs(pincode.map))
#     ) %>%
#     st_as_sf()

# Strategy: Transform to planar CRS, simplify, then transform back to WGS84
# This avoids S2 geometry validation issues with ellipsoidal coordinates

# Step 1: Transform to Indian planar CRS (UTM Zone 43N for central India)
# This allows using traditional (non-spherical) simplification algorithms
pincode.map <- st_transform(pincode.map, "EPSG:32643")  # UTM Zone 43N

# Step 2: Fix any invalid geometries
pincode.map <- st_make_valid(pincode.map)

# Step 3: Simplify using planar coordinates (dTolerance in meters)
# Using rmapshaper which is more robust for complex geometries
# keep = 0.05 means keep 5% of points (aggressive simplification)
# You can adjust this value: higher = less simplification (0.01 = 1%, 0.1 = 10%)
mv_simpl <- ms_simplify(pincode.map, keep = 0.0001, keep_shapes = TRUE)

# Alternative: Use st_simplify if rmapshaper doesn't work well
# Uncomment the line below and comment out the ms_simplify line above
# mv_simpl <- st_simplify(pincode.map, preserveTopology = TRUE, dTolerance = 500)

# Step 4: Transform back to WGS84 for web mapping
mv_simpl <- st_transform(mv_simpl, "EPSG:4326")

# Step 5: Final validation to ensure clean geometries
mv_simpl <- st_make_valid(mv_simpl)

# Step 6: Write to file
st_write(mv_simpl,
         here("public/India_Pincodes_simplified.geojson"),
         driver = "GeoJSON",
         delete_dsn = TRUE
)

