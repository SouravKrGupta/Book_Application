try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ModuleNotFoundError:
    pass
