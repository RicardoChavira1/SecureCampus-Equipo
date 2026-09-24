import sqlite3

def buscar_estudiante(nombre):
    conexion = sqlite3.connect("securecampus.db")
    cursor = conexion.cursor()
    # Consulta parametrizada para neutralizar la inyeccion SQL (CWE-89)
    consulta = (
        "SELECT id, nombre, correo "
        "FROM estudiantes "
        "WHERE nombre = ?"
    )
    cursor.execute(consulta, (nombre,))
    resultado = cursor.fetchall()
    conexion.close()
    return resultado

if __name__ == "__main__":
    nombre = input("Nombre del estudiante: ")
    estudiantes = buscar_estudiante(nombre)
    print(estudiantes)
