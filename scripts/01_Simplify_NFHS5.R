library(tidyverse)
library(here)
library(sf)
library(rmapshaper)
lgd.district.map <- st_read(here("public/India_NFHS5_districts.geojson"))
lgd.district.map$district_name <- lgd.district.map$REGNAME
lgd.district.map$state_name <- lgd.district.map$OTHREGNA
lgd.district.map$reg_code <- lgd.district.map$REGCODE
lgd.district.map <- st_make_valid(lgd.district.map)
lgd.district.map <- lgd.district.map %>% arrange(state_name, district_name, reg_code)
state_district <- lgd.district.map %>%
    select(state_name, district_name, reg_code) %>%
    as.data.frame() %>%
    select(state_name, district_name,reg_code) %>%
    arrange(state_name, district_name,reg_code) %>%
    unique()
write.csv(state_district,
          here("public/India_NFHS5_state_district_list.csv"),
          row.names = FALSE
)
unique(st_geometry_type(lgd.district.map))
# lgd.district.map <- lgd.district.map %>%
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
#         geometry = st_sfc(unlist(.$geometry, recursive = FALSE), crs = st_crs(lgd.district.map))
#     ) %>%
#     st_as_sf()

lgd.district.map <- st_transform(lgd.district.map, "EPSG:4326")
mv_simpl <- st_simplify(lgd.district.map, preserveTopology = FALSE, dTolerance = 1000)
mv_simpl2_sf <- st_as_sf(mv_simpl,
                         coords = c("x", "y"), crs = 4326,
                         agr = "constant"
)
st_write(mv_simpl2_sf,
         here("public/India_NFHS5_districts_simplified.geojson"),
         driver = "GeoJSON",
         delete_dsn = TRUE
)
